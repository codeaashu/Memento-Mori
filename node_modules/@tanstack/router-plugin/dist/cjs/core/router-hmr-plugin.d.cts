import { UnpluginFactory } from 'unplugin';
import { Config } from './config.cjs';
import { RouterPluginContext } from './router-plugin-context.cjs';
export declare function createRouterHmrPlugin(options: Partial<Config | (() => Config)> | undefined, routerPluginContext: RouterPluginContext): ReturnType<UnpluginFactory<Partial<Config> | undefined>>;
export declare const unpluginRouterHmrFactory: UnpluginFactory<Partial<Config> | undefined>;
