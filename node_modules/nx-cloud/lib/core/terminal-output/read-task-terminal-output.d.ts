import { OutputObfuscator } from './output-obfuscator';
export declare function readTaskTerminalOutput(cacheDirectory: string | undefined, outputObfuscator: OutputObfuscator, hash: string, cacheStatus: 'remote-cache-hit' | 'local-cache-hit' | 'cache-miss', code: number): string;
