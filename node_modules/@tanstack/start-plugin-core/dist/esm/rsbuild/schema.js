import { parseStartConfig as parseStartConfig$1, tanstackStartOptionsObjectSchema } from "../schema.js";
import { z } from "zod";
//#region src/rsbuild/schema.ts
var tanstackStartRsbuildOptionsSchema = tanstackStartOptionsObjectSchema.extend({ rsbuild: z.object({ installDevServerMiddleware: z.boolean().optional() }).optional() }).optional().default({});
function parseStartConfig(opts, corePluginOpts, root) {
	const { rsbuild: _rsbuild, ...coreOptions } = tanstackStartRsbuildOptionsSchema.parse(opts);
	return parseStartConfig$1(coreOptions, corePluginOpts, root);
}
//#endregion
export { parseStartConfig };

//# sourceMappingURL=schema.js.map