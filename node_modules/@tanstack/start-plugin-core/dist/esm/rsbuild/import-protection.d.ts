import { CompileStartFrameworkOptions, GetConfigFn } from '../types.js';
import { RsbuildPluginAPI } from '@rsbuild/core';
export declare function registerImportProtection(api: RsbuildPluginAPI, opts: {
    getConfig: GetConfigFn;
    framework: CompileStartFrameworkOptions;
    environments: Array<{
        name: string;
        type: 'client' | 'server';
    }>;
}): void;
