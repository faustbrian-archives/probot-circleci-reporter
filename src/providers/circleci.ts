import got from "got";
import { Context } from "probot";
import stripAnsi from "strip-ansi";

export class CircleCI {
	constructor(readonly context: Context) {}

	public parseLog(log) {
		// sp00ky RegExp to start the extraction
		const start = new RegExp(/\r\n|\n/g);

		// The first line can be either \n or \r\n, so
		// we need to know how to offset it.
		const offset = start.exec(log)[0].length;

		const end = "Test failed. See above for more details.";

		// Get the content between the test and end strings
		let content = log.substring(log.search(start) + offset, log.indexOf(end));

		// Remove the last line, it's usually extra
		content = content.substring(0, content.lastIndexOf("\n"));

		return content;
	}

	public async serialize() {
		const { target_url: targetUrl } = this.context.payload;
		const build = /https:\/\/circleci\.com\/gh\/(?:.+?\/){2}(\d+)/g.exec(targetUrl)[1];

		const { owner, repo } = this.context.repo();
		const buildJson = await this.sendRequest(
			`https://circleci.com/api/v1.1/project/github/${owner}/${repo}/${build}`,
		);

		if (buildJson.pull_requests) {
			const pullRequestUrl = buildJson.pull_requests[0].url;

			const failedStep = buildJson.steps.find(step => step.actions.some(action => action.exit_code !== null));
			const failedAction = failedStep.actions[failedStep.actions.length - 1];

			const response = await this.sendRequest(failedAction.output_url);

			const content: string = stripAnsi(this.parseLog(response[0].message));

			if (content.length >= 65536) {
				// trim the content
			}

			return {
				number: parseInt(pullRequestUrl.substr(pullRequestUrl.lastIndexOf("/")).substr(1), 10),
				data: {
					command: failedStep.name,
					content,
					targetUrl,
				},
			};
		} else {
			return false;
		}
	}

	private async sendRequest(url: string): Promise<any> {
		const { body } = await got(url, { headers: { Accept: "application/json" } });

		return JSON.parse(body);
	}
}
