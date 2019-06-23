export const newComment = async ({ context, template, data, sha, number, after, before, showNewLogs, showOldLogs }) =>
	context.github.issues.createComment(
		context.repo({
			issue_number: number,
			body: template({ ...data, commit: sha, after, before, showNewLogs, showOldLogs }),
		}),
	);

export const updateComment = async ({
	context,
	template,
	data,
	sha,
	comment,
	after,
	before,
	showNewLogs,
	showOldLogs,
}) => {
	let lastCommit: string;
	let lastLog: string;
	let oldLogs: string;

	if (showOldLogs) {
		try {
			lastCommit = /<!--LAST_COMMIT=(.+)-->/g.exec(comment.body)[1].substring(0, 7);
			lastLog = /<!--START_LOG-->([\s\S]+)<!--END_LOG-->/g.exec(comment.body)[1];
			oldLogs = /<!--START_OLD_LOGS-->([\s\S]+)<!--END_OLD_LOGS-->/g.exec(comment.body)[1];
		} catch {
			// malformed previous comment
		}
	}

	return context.github.issues.updateComment(
		context.repo({
			body: template({
				...data,
				commit: sha,
				oldLogs,
				lastLog,
				lastCommit,
				before,
				after,
				showNewLogs,
				showOldLogs,
			}),
			comment_id: comment.id,
		}),
	);
};
