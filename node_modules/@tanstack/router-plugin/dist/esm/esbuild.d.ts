import { configSchema, CodeSplittingOptions, Config } from './core/config.js';
import { RouterPluginContext } from './core/router-plugin-context.js';
type RouterPluginOptions = Partial<Config | (() => Config)> | undefined;
/**
 * @example
 * ```ts
 * export default {
 *   plugins: [TanStackRouterGeneratorEsbuild()],
 *   // ...
 * }
 * ```
 */
declare const TanStackRouterGeneratorEsbuild: (options?: RouterPluginOptions, routerPluginContext?: RouterPluginContext) => import('unplugin').EsbuildPlugin;
/**
 * @example
 * ```ts
 * export default {
 *  plugins: [TanStackRouterCodeSplitterEsbuild()],
 *  // ...
 * }
 * ```
 */
declare const TanStackRouterCodeSplitterEsbuild: (options?: RouterPluginOptions, routerPluginContext?: RouterPluginContext) => import('unplugin').EsbuildPlugin;
/**
 * @example
 * ```ts
 * export default {
 *   plugins: [tanstackRouter()],
 *   // ...
 * }
 * ```
 */
declare const TanStackRouterEsbuild: (options?: Partial<{
    target: "react" | "solid" | "vue";
    routeFileIgnorePrefix: string;
    routesDirectory: string;
    quoteStyle: "single" | "double";
    semicolons: boolean;
    disableLogging: boolean;
    routeTreeFileHeader: string[];
    indexToken: string | RegExp | {
        regex: string;
        flags?: string | undefined;
    };
    routeToken: string | RegExp | {
        regex: string;
        flags?: string | undefined;
    };
    generatedRouteTree: string;
    disableTypes: boolean;
    addExtensions: string | boolean;
    enableRouteTreeFormatting: boolean;
    tmpDir: string;
    importRoutesUsingAbsolutePaths: boolean;
    enableRouteGeneration?: boolean | undefined;
    codeSplittingOptions?: CodeSplittingOptions | undefined;
    plugin?: {
        vite?: {
            environmentName?: string | undefined;
        } | undefined;
        hmr?: {
            style?: "vite" | "webpack" | undefined;
        } | undefined;
    } | undefined;
    virtualRouteConfig?: string | import('@tanstack/virtual-file-routes').VirtualRootRoute | undefined;
    routeFilePrefix?: string | undefined;
    routeFileIgnorePattern?: string | undefined;
    pathParamsAllowedCharacters?: (";" | ":" | "@" | "&" | "=" | "+" | "$" | ",")[] | undefined;
    routeTreeFileFooter?: string[] | ((...args: unknown[]) => string[]) | undefined;
    autoCodeSplitting?: boolean | undefined;
    customScaffolding?: {
        routeTemplate?: string | undefined;
        lazyRouteTemplate?: string | undefined;
    } | undefined;
    experimental?: {
        enableCodeSplitting?: boolean | undefined;
    } | undefined;
    plugins?: import('@tanstack/router-generator').GeneratorPlugin[] | undefined;
} | (() => Config)> | undefined) => import('unplugin').EsbuildPlugin;
declare const tanstackRouter: (options?: Partial<{
    target: "react" | "solid" | "vue";
    routeFileIgnorePrefix: string;
    routesDirectory: string;
    quoteStyle: "single" | "double";
    semicolons: boolean;
    disableLogging: boolean;
    routeTreeFileHeader: string[];
    indexToken: string | RegExp | {
        regex: string;
        flags?: string | undefined;
    };
    routeToken: string | RegExp | {
        regex: string;
        flags?: string | undefined;
    };
    generatedRouteTree: string;
    disableTypes: boolean;
    addExtensions: string | boolean;
    enableRouteTreeFormatting: boolean;
    tmpDir: string;
    importRoutesUsingAbsolutePaths: boolean;
    enableRouteGeneration?: boolean | undefined;
    codeSplittingOptions?: CodeSplittingOptions | undefined;
    plugin?: {
        vite?: {
            environmentName?: string | undefined;
        } | undefined;
        hmr?: {
            style?: "vite" | "webpack" | undefined;
        } | undefined;
    } | undefined;
    virtualRouteConfig?: string | import('@tanstack/virtual-file-routes').VirtualRootRoute | undefined;
    routeFilePrefix?: string | undefined;
    routeFileIgnorePattern?: string | undefined;
    pathParamsAllowedCharacters?: (";" | ":" | "@" | "&" | "=" | "+" | "$" | ",")[] | undefined;
    routeTreeFileFooter?: string[] | ((...args: unknown[]) => string[]) | undefined;
    autoCodeSplitting?: boolean | undefined;
    customScaffolding?: {
        routeTemplate?: string | undefined;
        lazyRouteTemplate?: string | undefined;
    } | undefined;
    experimental?: {
        enableCodeSplitting?: boolean | undefined;
    } | undefined;
    plugins?: import('@tanstack/router-generator').GeneratorPlugin[] | undefined;
} | (() => Config)> | undefined) => import('unplugin').EsbuildPlugin;
export default TanStackRouterEsbuild;
export { configSchema, TanStackRouterGeneratorEsbuild, TanStackRouterCodeSplitterEsbuild, TanStackRouterEsbuild, tanstackRouter, };
export type { Config, CodeSplittingOptions, RouterPluginContext };
