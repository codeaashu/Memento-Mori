//#region src/createIsomorphicFn.ts
function createIsomorphicFn() {
	const fn = () => void 0;
	return Object.assign(fn, {
		server: () => ({ client: () => () => {} }),
		client: () => ({ server: () => () => {} })
	});
}
//#endregion
export { createIsomorphicFn };

//# sourceMappingURL=createIsomorphicFn.js.map