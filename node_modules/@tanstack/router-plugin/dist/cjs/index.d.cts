export { configSchema, getConfig } from './core/config.cjs';
export { unpluginRouterCodeSplitterFactory } from './core/router-code-splitter-plugin.cjs';
export { unpluginRouterGeneratorFactory } from './core/router-generator-plugin.cjs';
export { createRouterPluginContext } from './core/router-plugin-context.cjs';
export type { Config, ConfigInput, ConfigOutput, CodeSplittingOptions, DeletableNodes, HmrOptions, } from './core/config.cjs';
export type { RouterPluginContext } from './core/router-plugin-context.cjs';
export { tsrSplit, splitRouteIdentNodes, defaultCodeSplitGroupings, } from './core/constants.cjs';
