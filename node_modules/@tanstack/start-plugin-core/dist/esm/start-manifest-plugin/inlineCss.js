import { transform } from "lightningcss";
//#region src/start-manifest-plugin/inlineCss.ts
var cssUrlPattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"']*?))\s*\)|@import\s+(?:url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"']*?))\s*\)|"([^"]*)"|'([^']*)')/gi;
function isRelativeCssUrl(url) {
	if (!url) return false;
	if (url.startsWith("#")) return false;
	if (url.startsWith("/")) return false;
	if (/^[a-z][a-z\d+.-]*:/i.test(url)) return false;
	return true;
}
function shouldRebaseInlineCssUrls(css) {
	cssUrlPattern.lastIndex = 0;
	for (const match of css.matchAll(cssUrlPattern)) if (isRelativeCssUrl((match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6] ?? match[7] ?? match[8] ?? "").trim())) return true;
	return false;
}
function rebaseCssUrl(url, cssHref) {
	if (!isRelativeCssUrl(url)) return url;
	const fakeOrigin = "http://tanstack.local";
	const resolved = new URL(url, new URL(cssHref, fakeOrigin));
	if (resolved.origin === fakeOrigin) return `${resolved.pathname}${resolved.search}${resolved.hash}`;
	return resolved.href;
}
function rebaseInlineCssUrls(options) {
	const css = options.css.trim();
	if (!shouldRebaseInlineCssUrls(css)) return css;
	const result = transform({
		filename: options.cssHref,
		code: Buffer.from(css),
		minify: true,
		visitor: {
			Url(url) {
				return {
					...url,
					url: rebaseCssUrl(url.url, options.cssHref)
				};
			},
			Rule: { import(rule) {
				return {
					...rule,
					value: {
						...rule.value,
						url: rebaseCssUrl(rule.value.url, options.cssHref)
					}
				};
			} }
		}
	});
	return Buffer.from(result.code).toString("utf8");
}
function getCssAssetSource(source) {
	if (typeof source === "string") return source;
	if (source instanceof Uint8Array) return Buffer.from(source).toString("utf8");
	if (source == null) return void 0;
	return String(source);
}
//#endregion
export { getCssAssetSource, rebaseInlineCssUrls };

//# sourceMappingURL=inlineCss.js.map