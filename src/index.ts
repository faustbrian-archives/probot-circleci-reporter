import handlebars from "handlebars";
import { Application, Octokit } from "probot";
import { Serializer } from "./serializer";
import { newComment, updateComment } from "./services/api";
import { loadConfig } from "./services/config";
import { templateFailure, templateSuccess } from "./templates";

export = async (robot: Application) => {
	robot.on("status", async context => {
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

				const comment: Octokit.IssuesListCommentsResponseItem = (await context.github.issues.listComments(
					context.repo({ issue_number: serialized.number }),
				)).data.find(c => c.user.login === `${process.env.APP_NAME}[bot]`);

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
			// @TODO
		}
	});
};
