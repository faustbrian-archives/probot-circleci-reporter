import { getConfig } from "@botamic/toolkit";
import Joi from "@hapi/joi";
import { Context } from "probot";

export const loadConfig = async (context: Context): Promise<Record<string, any>> =>
	(await getConfig(
		context,
		"botamic.yml",
		Joi.object({
			"circleci-reporter": Joi.object({
				success: Joi.object({
					deleteComment: Joi.bool().default(false),
					message: Joi.object({
						before: Joi.alternatives(Joi.string(), Joi.bool()).default("Your tests passed again!"),
						after: Joi.alternatives(Joi.string(), Joi.bool()).default(false),
					}).default(),
				}).default(),
				failure: Joi.object({
					message: Joi.object({
						before: Joi.alternatives(Joi.string(), Joi.bool()).default(
							"The [{{ contextId }}]({{ contextUrl }}) job is failing as of [{{ commitId }}]({{ commitUrl }}). Please [review the logs for more information]({{ contextUrl }}).",
						),
						after: Joi.alternatives(Joi.string(), Joi.bool()).default(
							"_Once you've pushed the fixes, the build will automatically re-run. Thanks!_",
						),
					}).default(),
					showNewLogs: Joi.bool().default(true),
					showOldLogs: Joi.bool().default(true),
				}).default(),
			}).default(),
		})
			.unknown(true)
			.default(),
	))["circleci-reporter"];
