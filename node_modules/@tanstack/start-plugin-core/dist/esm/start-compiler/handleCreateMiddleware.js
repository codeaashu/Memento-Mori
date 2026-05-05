import { stripMethodCall } from "./utils.js";
//#region src/start-compiler/handleCreateMiddleware.ts
/**
* Handles createMiddleware transformations for a batch of candidates.
*
* @param candidates - All Middleware candidates to process
* @param context - The compilation context
*/
function handleCreateMiddleware(candidates, context) {
	if (context.env === "server") throw new Error("handleCreateMiddleware should not be called on the server");
	for (const candidate of candidates) {
		const { inputValidator, server } = candidate.methodChain;
		if (inputValidator) {
			if (!inputValidator.callPath.node.arguments[0]) throw new Error("createMiddleware().inputValidator() must be called with a validator!");
			stripMethodCall(inputValidator.callPath);
		}
		if (server) stripMethodCall(server.callPath);
	}
}
//#endregion
export { handleCreateMiddleware };

//# sourceMappingURL=handleCreateMiddleware.js.map