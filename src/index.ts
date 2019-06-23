import handlebars from "handlebars";
import { Application, Context, Octokit } from "probot";
import { CircleCI } from "./providers/circleci";
import { newComment, updateComment } from "./services/api";
import { loadConfig } from "./services/config";
import { templateFailure } from "./templates";

// move to toolkit
const getPreviousComment = async (context: Context, id: number): Promise<Octokit.IssuesListCommentsResponseItem> =>
	(await context.github.issues.listComments(context.repo({ issue_number: id }))).data.find(
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

			const serialized = await new CircleCI(context).serialize();

			if (serialized) {
				const config: Record<string, any> = await loadConfig(context);

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
					after: handlebars.compile(config.failure.message.after)(commitData),
					before: handlebars.compile(config.failure.message.before)(commitData),
					showNewLogs: config.failure.showNewLogs,
					showOldLogs: config.failure.showOldLogs,
				};

				const comment: Octokit.IssuesListCommentsResponseItem = await getPreviousComment(
					context,
					serialized.number,
				);

				if (comment) {
					context.log(`[${owner}/${repo}] Updating comment #${serialized.number}`);

					return updateComment({
						...opts,
						...{ comment },
					});
				}

				context.log(`[${owner}/${repo}] Creating comment #${serialized.number}`);

				return newComment(opts);
			}
		} else if (context.payload.state === "success") {
			const { context: statusContext, sha } = context.payload;

			if (!statusContext.startsWith("ci/circleci")) {
				context.log(`Context [${statusContext}] does not exist`);
				return;
			}

			const pullRequests = await context.github.search.issuesAndPullRequests({
				q: `${sha} is:pr is:open repo:${owner}/${repo}`,
			});

			if (!pullRequests.data.total_count) {
				return;
			}

			const pullRequestNumber: number = pullRequests.data.items[0].number;

			const comment: Octokit.IssuesListCommentsResponseItem = await getPreviousComment(
				context,
				pullRequestNumber,
			);

			if (!comment) {
				return;
			}

			const config: Record<string, any> = await loadConfig(context);

			if (config.success.deleteComment) {
				context.log(`[${owner}/${repo}] Deleting comment #${comment.id}`);

				return context.github.issues.deleteComment(
					context.repo({
						comment_id: comment.id,
					}),
				);
			}

			if (!comment.body.startsWith("<details>")) {
				context.log(`[${owner}/${repo}] Creating comment #${comment.id}`);

				return context.github.issues.updateComment(
					context.repo({
						issue_number: pullRequestNumber,
						body: `<details>\n<summary>${config.success.message.before}</summary>\n\n${comment.body}\n</details>`,
						comment_id: comment.id,
					}),
				);
			}
		}
	});
};
