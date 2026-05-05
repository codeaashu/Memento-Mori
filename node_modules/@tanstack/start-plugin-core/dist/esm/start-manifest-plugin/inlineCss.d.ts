export declare function shouldRebaseInlineCssUrls(css: string): boolean;
export declare function rebaseInlineCssUrls(options: {
    css: string;
    cssHref: string;
}): string;
export declare function getCssAssetSource(source: unknown): string | undefined;
