import { AnyRoute, AnyRouteMatch, AssetCrossOrigin, Manifest } from '@tanstack/router-core';
export type EarlyHint = {
    href: string;
    rel: 'preload' | 'modulepreload' | 'preconnect' | 'dns-prefetch';
    as?: 'fetch' | 'font' | 'image' | 'script' | 'style' | 'track';
    crossOrigin?: AssetCrossOrigin | '';
    type?: string;
    integrity?: string;
    referrerPolicy?: string;
    fetchPriority?: string;
};
export type EarlyHintsPhase = 'static' | 'dynamic';
export type EarlyHintsEvent = {
    phase: EarlyHintsPhase;
    hints: ReadonlyArray<EarlyHint>;
    links: Array<string>;
    allHints: ReadonlyArray<EarlyHint>;
    allLinks: Array<string>;
};
export type OnEarlyHints = (event: EarlyHintsEvent) => void | Promise<void>;
export type ResponseLinkHeaderEntry = {
    phase: EarlyHintsPhase;
    hint: EarlyHint;
    link: string;
};
export type ResponseLinkHeaderFilter = (entry: ResponseLinkHeaderEntry) => boolean;
export type ResponseLinkHeaderOptions = {
    filter?: ResponseLinkHeaderFilter;
};
export declare function serializeEarlyHint(hint: EarlyHint): string;
export declare function collectStaticHintsFromManifest(manifest: Manifest, matchedRoutes: ReadonlyArray<AnyRoute>): Array<EarlyHint>;
export declare function collectDynamicHintsFromMatches(matches: ReadonlyArray<AnyRouteMatch>): Array<EarlyHint>;
export declare function createEarlyHintsEvent(opts: {
    phase: EarlyHintsPhase;
    hints: ReadonlyArray<EarlyHint>;
    sentLinks: Set<string>;
    sentHints: Array<EarlyHint>;
}): EarlyHintsEvent | undefined;
export declare function createResponseLinkHeaderEntries(opts: {
    phase: EarlyHintsPhase;
    hints: ReadonlyArray<EarlyHint>;
    sentLinks: Set<string>;
    entries: Array<ResponseLinkHeaderEntry>;
}): void;
export declare function getResponseLinkHeaderEntries(opts: {
    entries: ReadonlyArray<ResponseLinkHeaderEntry>;
    filter?: ResponseLinkHeaderFilter;
}): Array<string>;
