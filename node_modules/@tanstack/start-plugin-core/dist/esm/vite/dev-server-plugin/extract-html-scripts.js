import * as cheerio from "cheerio";
//#region src/vite/dev-server-plugin/extract-html-scripts.ts
function extractHtmlScripts(html) {
	const $ = cheerio.load(html);
	const scripts = [];
	$("script").each((_, element) => {
		const src = $(element).attr("src");
		const content = $(element).html() ?? void 0;
		scripts.push({
			src,
			content
		});
	});
	return scripts;
}
//#endregion
export { extractHtmlScripts };

//# sourceMappingURL=extract-html-scripts.js.map