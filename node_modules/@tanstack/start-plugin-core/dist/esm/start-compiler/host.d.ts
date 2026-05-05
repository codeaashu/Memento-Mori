import { StartCompiler } from './compiler.js';
import { CompileStartFrameworkOptions, StartCompilerImportTransform } from '../types.js';
import { DevServerFnModuleSpecifierEncoder, GenerateFunctionIdFnOptional, ServerFn } from './types.js';
export interface CreateStartCompilerOptions {
    env: 'client' | 'server';
    envName: string;
    root: string;
    framework: CompileStartFrameworkOptions;
    providerEnvName: string;
    mode: 'dev' | 'build';
    generateFunctionId?: GenerateFunctionIdFnOptional;
    compilerTransforms?: Array<StartCompilerImportTransform> | undefined;
    serverFnProviderModuleDirectives?: ReadonlyArray<string> | undefined;
    onServerFnsById?: (d: Record<string, ServerFn>) => void;
    getKnownServerFns: () => Record<string, ServerFn>;
    encodeModuleSpecifierInDev?: DevServerFnModuleSpecifierEncoder;
    loadModule: (id: string) => Promise<void>;
    resolveId: (id: string, importer?: string) => Promise<string | null>;
}
export declare function createStartCompiler(options: CreateStartCompilerOptions): StartCompiler;
export declare function mergeServerFnsById(current: Record<string, ServerFn>, next: Record<string, ServerFn>): void;
export declare function matchesCodeFilters(code: string, filters: ReadonlyArray<RegExp>): boolean;
