//#region src/core/hmr/handle-route-update.ts
function handleRouteUpdate(routeId, newRoute) {
	const router = window.__TSR_ROUTER__;
	const oldRoute = router.routesById[routeId];
	if (!oldRoute) return;
	const removedKeys = /* @__PURE__ */ new Set();
	Object.keys(oldRoute.options).forEach((key) => {
		if (!(key in newRoute.options)) {
			removedKeys.add(key);
			delete oldRoute.options[key];
		}
	});
	const preserveComponentIdentity = "shellComponent" in oldRoute.options === "shellComponent" in newRoute.options;
	const componentKeys = "__TSR_COMPONENT_TYPES__";
	if (preserveComponentIdentity) componentKeys.forEach((key) => {
		if (key in oldRoute.options && key in newRoute.options) newRoute.options[key] = oldRoute.options[key];
	});
	oldRoute.options = newRoute.options;
	oldRoute.update(newRoute.options);
	oldRoute._componentsPromise = void 0;
	oldRoute._lazyPromise = void 0;
	router.routesById[oldRoute.id] = oldRoute;
	router.routesByPath[oldRoute.fullPath] = oldRoute;
	router.processedTree.matchCache.clear();
	router.processedTree.flatCache?.clear();
	router.processedTree.singleCache.clear();
	router.resolvePathCache.clear();
	walkReplaceSegmentTree(oldRoute, router.processedTree.segmentTree);
	const filter = (m) => m.routeId === oldRoute.id;
	const activeMatch = router.stores.matches.get().find(filter);
	const pendingMatch = router.stores.pendingMatches.get().find(filter);
	const cachedMatches = router.stores.cachedMatches.get().filter(filter);
	if (activeMatch || pendingMatch || cachedMatches.length > 0) {
		if (removedKeys.has("loader") || removedKeys.has("beforeLoad")) {
			const matchIds = [
				activeMatch?.id,
				pendingMatch?.id,
				...cachedMatches.map((match) => match.id)
			].filter(Boolean);
			router.batch(() => {
				for (const matchId of matchIds) {
					const store = router.stores.pendingMatchStores.get(matchId) || router.stores.matchStores.get(matchId) || router.stores.cachedMatchStores.get(matchId);
					if (store) store.set((prev) => {
						const next = { ...prev };
						if (removedKeys.has("loader")) next.loaderData = void 0;
						if (removedKeys.has("beforeLoad")) {
							next.__beforeLoadContext = void 0;
							next.context = rebuildMatchContextWithoutBeforeLoad(next);
						}
						return next;
					});
				}
			});
		}
		router.invalidate({
			filter,
			sync: true
		});
	}
	function walkReplaceSegmentTree(route, node) {
		if (node.route?.id === route.id) node.route = route;
		if (node.index) walkReplaceSegmentTree(route, node.index);
		node.static?.forEach((child) => walkReplaceSegmentTree(route, child));
		node.staticInsensitive?.forEach((child) => walkReplaceSegmentTree(route, child));
		node.dynamic?.forEach((child) => walkReplaceSegmentTree(route, child));
		node.optional?.forEach((child) => walkReplaceSegmentTree(route, child));
		node.wildcard?.forEach((child) => walkReplaceSegmentTree(route, child));
	}
	function getStoreMatch(matchId) {
		return router.stores.pendingMatchStores.get(matchId)?.get() || router.stores.matchStores.get(matchId)?.get() || router.stores.cachedMatchStores.get(matchId)?.get();
	}
	function getMatchList(matchId) {
		const pendingMatches = router.stores.pendingMatches.get();
		if (pendingMatches.some((match) => match.id === matchId)) return pendingMatches;
		const activeMatches = router.stores.matches.get();
		if (activeMatches.some((match) => match.id === matchId)) return activeMatches;
		const cachedMatches = router.stores.cachedMatches.get();
		if (cachedMatches.some((match) => match.id === matchId)) return cachedMatches;
		return [];
	}
	function getParentMatch(match) {
		const matchList = getMatchList(match.id);
		const matchIndex = matchList.findIndex((item) => item.id === match.id);
		if (matchIndex <= 0) return;
		const parentMatch = matchList[matchIndex - 1];
		return getStoreMatch(parentMatch.id) || parentMatch;
	}
	function rebuildMatchContextWithoutBeforeLoad(match) {
		const parentMatch = getParentMatch(match);
		const getParentContext = router.getParentContext;
		return {
			...(getParentContext ? getParentContext.call(router, parentMatch) : parentMatch?.context ?? router.options.context) ?? {},
			...match.__routeContext ?? {}
		};
	}
}
var handleRouteUpdateStr = handleRouteUpdate.toString();
function getHandleRouteUpdateCode(stableRouteOptionKeys) {
	return handleRouteUpdateStr.replace(/['"]__TSR_COMPONENT_TYPES__['"]/, JSON.stringify(stableRouteOptionKeys));
}
//#endregion
export { getHandleRouteUpdateCode };

//# sourceMappingURL=handle-route-update.js.map