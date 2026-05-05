import { useRouter } from "./useRouter.js";
import { deepEqual, escapeHtml, getAssetCrossOrigin, isInlinableStylesheet, resolveManifestAssetLink } from "@tanstack/router-core";
import * as React$1 from "react";
import { useStore } from "@tanstack/react-store";
import { isServer } from "@tanstack/router-core/isServer";
//#region src/headContentUtils.tsx
function buildTagsFromMatches(router, nonce, matches, assetCrossOrigin) {
	const routeMeta = matches.map((match) => match.meta).filter(Boolean);
	const resultMeta = [];
	const metaByAttribute = {};
	let title;
	for (let i = routeMeta.length - 1; i >= 0; i--) {
		const metas = routeMeta[i];
		for (let j = metas.length - 1; j >= 0; j--) {
			const m = metas[j];
			if (!m) continue;
			if (m.title) {
				if (!title) title = {
					tag: "title",
					children: m.title
				};
			} else if ("script:ld+json" in m) try {
				const json = JSON.stringify(m["script:ld+json"]);
				resultMeta.push({
					tag: "script",
					attrs: { type: "application/ld+json" },
					children: escapeHtml(json)
				});
			} catch {}
			else {
				const attribute = m.name ?? m.property;
				if (attribute) if (metaByAttribute[attribute]) continue;
				else metaByAttribute[attribute] = true;
				resultMeta.push({
					tag: "meta",
					attrs: {
						...m,
						nonce
					}
				});
			}
		}
	}
	if (title) resultMeta.push(title);
	if (nonce) resultMeta.push({
		tag: "meta",
		attrs: {
			property: "csp-nonce",
			content: nonce
		}
	});
	resultMeta.reverse();
	const constructedLinks = matches.map((match) => match.links).filter(Boolean).flat(1).map((link) => ({
		tag: "link",
		attrs: {
			...link,
			nonce
		}
	}));
	const manifest = router.ssr?.manifest;
	const assetLinks = matches.map((match) => manifest?.routes[match.routeId]?.assets ?? []).filter(Boolean).flat(1).flatMap((asset) => {
		if (asset.tag === "link") {
			if (isInlinableStylesheet(manifest, asset)) return [];
			return [{
				tag: "link",
				attrs: {
					...asset.attrs,
					crossOrigin: getAssetCrossOrigin(assetCrossOrigin, "stylesheet") ?? asset.attrs?.crossOrigin,
					suppressHydrationWarning: true,
					nonce
				}
			}];
		}
		if (asset.tag === "style") return [{
			tag: "style",
			attrs: {
				...asset.attrs,
				nonce
			},
			children: asset.children,
			...asset.inlineCss ? { inlineCss: true } : {}
		}];
		return [];
	});
	const preloadLinks = [];
	matches.map((match) => router.looseRoutesById[match.routeId]).forEach((route) => router.ssr?.manifest?.routes[route.id]?.preloads?.filter(Boolean).forEach((preload) => {
		const preloadLink = resolveManifestAssetLink(preload);
		preloadLinks.push({
			tag: "link",
			attrs: {
				rel: "modulepreload",
				href: preloadLink.href,
				crossOrigin: getAssetCrossOrigin(assetCrossOrigin, "modulepreload") ?? preloadLink.crossOrigin,
				nonce
			}
		});
	}));
	const styles = matches.map((match) => match.styles).flat(1).filter(Boolean).map(({ children, ...attrs }) => ({
		tag: "style",
		attrs: {
			...attrs,
			nonce
		},
		children
	}));
	const headScripts = matches.map((match) => match.headScripts).flat(1).filter(Boolean).map(({ children, ...script }) => ({
		tag: "script",
		attrs: {
			...script,
			nonce
		},
		children
	}));
	return uniqBy([
		...resultMeta,
		...preloadLinks,
		...constructedLinks,
		...assetLinks,
		...styles,
		...headScripts
	], (d) => JSON.stringify(d));
}
/**
* Build the list of head/link/meta/script tags to render for active matches.
* Used internally by `HeadContent`.
*/
var useTags = (assetCrossOrigin) => {
	const router = useRouter();
	const nonce = router.options.ssr?.nonce;
	if (isServer ?? router.isServer) return buildTagsFromMatches(router, nonce, router.stores.matches.get(), assetCrossOrigin);
	const routeMeta = useStore(router.stores.matches, (matches) => {
		return matches.map((match) => match.meta).filter(Boolean);
	}, deepEqual);
	const meta = React$1.useMemo(() => {
		const resultMeta = [];
		const metaByAttribute = {};
		let title;
		for (let i = routeMeta.length - 1; i >= 0; i--) {
			const metas = routeMeta[i];
			for (let j = metas.length - 1; j >= 0; j--) {
				const m = metas[j];
				if (!m) continue;
				if (m.title) {
					if (!title) title = {
						tag: "title",
						children: m.title
					};
				} else if ("script:ld+json" in m) try {
					const json = JSON.stringify(m["script:ld+json"]);
					resultMeta.push({
						tag: "script",
						attrs: { type: "application/ld+json" },
						children: escapeHtml(json)
					});
				} catch {}
				else {
					const attribute = m.name ?? m.property;
					if (attribute) if (metaByAttribute[attribute]) continue;
					else metaByAttribute[attribute] = true;
					resultMeta.push({
						tag: "meta",
						attrs: {
							...m,
							nonce
						}
					});
				}
			}
		}
		if (title) resultMeta.push(title);
		if (nonce) resultMeta.push({
			tag: "meta",
			attrs: {
				property: "csp-nonce",
				content: nonce
			}
		});
		resultMeta.reverse();
		return resultMeta;
	}, [routeMeta, nonce]);
	const links = useStore(router.stores.matches, (matches) => {
		const constructed = matches.map((match) => match.links).filter(Boolean).flat(1).map((link) => ({
			tag: "link",
			attrs: {
				...link,
				nonce
			}
		}));
		const manifest = router.ssr?.manifest;
		const assets = matches.map((match) => manifest?.routes[match.routeId]?.assets ?? []).filter(Boolean).flat(1).flatMap((asset) => {
			if (asset.tag === "link") {
				if (isInlinableStylesheet(manifest, asset)) return [];
				return [{
					tag: "link",
					attrs: {
						...asset.attrs,
						crossOrigin: getAssetCrossOrigin(assetCrossOrigin, "stylesheet") ?? asset.attrs?.crossOrigin,
						suppressHydrationWarning: true,
						nonce
					}
				}];
			}
			if (asset.tag === "style") return [{
				tag: "style",
				attrs: {
					...asset.attrs,
					nonce
				},
				children: asset.children,
				...asset.inlineCss ? { inlineCss: true } : {}
			}];
			return [];
		});
		return [...constructed, ...assets];
	}, deepEqual);
	const preloadLinks = useStore(router.stores.matches, (matches) => {
		const preloadLinks = [];
		matches.map((match) => router.looseRoutesById[match.routeId]).forEach((route) => router.ssr?.manifest?.routes[route.id]?.preloads?.filter(Boolean).forEach((preload) => {
			const preloadLink = resolveManifestAssetLink(preload);
			preloadLinks.push({
				tag: "link",
				attrs: {
					rel: "modulepreload",
					href: preloadLink.href,
					crossOrigin: getAssetCrossOrigin(assetCrossOrigin, "modulepreload") ?? preloadLink.crossOrigin,
					nonce
				}
			});
		}));
		return preloadLinks;
	}, deepEqual);
	const styles = useStore(router.stores.matches, (matches) => matches.map((match) => match.styles).flat(1).filter(Boolean).map(({ children, ...attrs }) => ({
		tag: "style",
		attrs: {
			...attrs,
			nonce
		},
		children
	})), deepEqual);
	const headScripts = useStore(router.stores.matches, (matches) => matches.map((match) => match.headScripts).flat(1).filter(Boolean).map(({ children, ...script }) => ({
		tag: "script",
		attrs: {
			...script,
			nonce
		},
		children
	})), deepEqual);
	return uniqBy([
		...meta,
		...preloadLinks,
		...links,
		...styles,
		...headScripts
	], (d) => {
		return JSON.stringify(d);
	});
};
function uniqBy(arr, fn) {
	const seen = /* @__PURE__ */ new Set();
	return arr.filter((item) => {
		const key = fn(item);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
//#endregion
export { useTags };

//# sourceMappingURL=headContentUtils.js.map