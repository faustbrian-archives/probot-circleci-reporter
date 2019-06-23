import handlebars from "handlebars";
import { Application, Context, Octokit } from "probot";
import { Serializer } from "./serializer";
import { newComment, updateComment } from "./services/api";
import { loadConfig } from "./services/config";
import { templateFailure } from "./templates";

// move to toolkit
const getExistingComment = async (context: Context, id: number): Promise<Octokit.IssuesListCommentsResponseItem> =>
	(await context.github.issues.listComments(context.issue({ issue_number: id }))).data.find(
		comment => comment.user.login === `${process.env.APP_NAME}[bot]`,
	);

export = async (robot: Application) => {
	robot.on("status", async (context: Context) => {
		const { owner, repo } = context.repo();

		if (context.payload.state === "failure") {
			const { context: statusContext, sha } = context.payload;

			if (!statusContext.startsWith("ci/circleci")) {
				context.log(`Context [${statusContext}] does not exist`);
				return;
			}

			context.log(`Creating instance for ${context.id}`);

			const serialized = await new Serializer(context).serialize();

			if (serialized) {
				const config: Record<string, string | boolean> = await loadConfig(context);

				const commitData = {
					...serialized.data,
					contextId: context.payload.context,
					contextUrl: context.payload.target_url,
					commitId: context.payload.commit.sha,
					commitUrl: context.payload.commit.html_url,
				};

				const opts = {
					context,
					template: handlebars.compile(templateFailure),
					data: serialized.data,
					sha,
					number: serialized.number,
					after: config.after && handlebars.compile(config.after)(commitData),
					before: config.before && handlebars.compile(config.before)(commitData),
					showNewLogs: config.showNewLogs,
					showOldLogs: config.showOldLogs,
				};

				const comment: Octokit.IssuesListCommentsResponseItem = await getExistingComment(
					context,
					serialized.number,
				);

				if (comment) {
					context.log(`Updating comment ${owner}/${repo} #${serialized.number}`);

					return updateComment({
						...opts,
						...{ comment },
					});
				}

				context.log(`Creating comment ${owner}/${repo} #${serialized.number}`);

				return newComment(opts);
			}
		} else if (context.payload.state === "success") {
			const { context: statusContext, sha } = context.payload;

			if (!statusContext.startsWith("ci/circleci")) {
				context.log(`Context [${statusContext}] does not exist`);
				return;
			}

			const pullRequests = await context.github.search.issuesAndPullRequests({
				q: `${sha} is:pr repo:${owner}/${repo}`,
			});

			if (!pullRequests.data.total_count) {
				return;
			}

			const { number } = pullRequests.data.items.find(pullRequest => pullRequest.state === "open");

			const comment: Octokit.IssuesListCommentsResponseItem = await getExistingComment(context, number);

			if (comment && !comment.body.startsWith("<details>")) {
				const summary = "Your tests are passing again!";
				const body = `<details>\n<summary>${summary}</summary>\n\n${comment.body}\n</details>`;

				return context.github.issues.updateComment(
					context.repo({ issue_number: number, body, comment_id: comment.id }),
				);
			}
		}
	});
};
