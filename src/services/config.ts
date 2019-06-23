import { Context } from "probot";
import getConfig from "probot-config";

export const loadConfig = async (context: Context): Promise<Record<string, string | boolean>> =>
	getConfig(context, "botamic.yml", {
		showNewLogs: true,
		showOldLogs: true,
		before:
			"The [{{ contextId }}]({{ contextUrl }}) job is failing as of [{{ commitId }}]({{ commitUrl }}). Please [review the logs for more information]({{ contextUrl }}).",
		after: "_Once you've pushed the fixes, the build will automatically re-run. Thanks!_",
	});