import { RsbuildConfig } from '@rsbuild/core';
type ServerSetupFn = Extract<NonNullable<NonNullable<RsbuildConfig['server']>['setup']>, (...args: Array<any>) => any>;
/**
 * Returns a `server.setup` function for rsbuild v2.
 *
 * Two middleware positions are used:
 *
 * 1. **Setup body** (BEFORE built-ins): Intercepts `/_serverFn/` URLs so
 *    they never reach rsbuild's htmlFallback/htmlCompletion middleware,
 *    which can swallow long base64 function IDs.
 *
 * 2. **Returned callback** (AFTER built-ins, BEFORE fallback): Handles
 *    all remaining SSR requests (page navigations). This position lets
 *    rsbuild's asset middleware serve compiled JS/CSS first.
 *
 * See rsbuild source: devMiddlewares.ts `applyDefaultMiddlewares()`.
 */
export declare function createServerSetup(opts: {
    serverFnBasePath: string;
}): ServerSetupFn;
export {};
