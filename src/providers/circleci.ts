import got from "got";
import { Context } from "probot";
import stripAnsi from "strip-ansi";

export class CircleCI {
	constructor(readonly context: Context) {}

	public async serialize() {
		const { target_url: targetUrl } = this.context.payload;
		const build = /https:\/\/circleci\.com\/gh\/(?:.+?\/){2}(\d+)/g.exec(targetUrl)[1];

		const { owner, repo } = this.context.repo();
		const buildJson = await this.sendRequest(
			`https://circleci.com/api/v1.1/project/github/${owner}/${repo}/${build}`,
		);

		if (buildJson.pull_requests) {
			const pullRequestUrl: string = buildJson.pull_requests[0].url;

			const failedStep = buildJson.steps.find(step => step.actions.some(action => action.exit_code !== null));
			const failedAction = failedStep.actions[failedStep.actions.length - 1];

			const response = await this.sendRequest(failedAction.output_url);

			let content: string = stripAnsi(this.parseLog(response[0].message));

			if (content.length >= 65536) {
				content = content.substring(0, 256);
			}

			return {
				number: parseInt(pullRequestUrl.substr(pullRequestUrl.lastIndexOf("/")).substr(1), 10),
				data: {
					command: failedStep.name,
					content,
					targetUrl,
				},
			};
		}

		return false;
	}

	private parseLog(log: string): string {
		const start: RegExp = new RegExp(/\r\n|\n/g);

		const content: string = log.substring(
			log.search(start) + start.exec(log)[0].length,
			log.indexOf("Test failed. See above for more details."),
		);

		return content.substring(0, content.lastIndexOf("\n"));
	}

	private async sendRequest(url: string): Promise<any> {
		const { body } = await got(url, { headers: { Accept: "application/json" } });

		return JSON.parse(body);
	}
}
