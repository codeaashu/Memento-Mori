//#region src/constants.ts
var START_ENVIRONMENT_NAMES = {
	server: "ssr",
	client: "client"
};
var VITE_ENVIRONMENT_NAMES = START_ENVIRONMENT_NAMES;
var ENTRY_POINTS = {
	client: "virtual:tanstack-start-client-entry",
	server: "virtual:tanstack-start-server-entry",
	start: "#tanstack-start-entry",
	router: "#tanstack-router-entry"
};
var SERVER_FN_LOOKUP = "server-fn-module-lookup";
var TRANSFORM_ID_REGEX = [/\.[cm]?[tj]sx?($|\?)/];
//#endregion
export { ENTRY_POINTS, SERVER_FN_LOOKUP, START_ENVIRONMENT_NAMES, TRANSFORM_ID_REGEX, VITE_ENVIRONMENT_NAMES };

//# sourceMappingURL=constants.js.map