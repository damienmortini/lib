import type { Extension } from '../extension.js';
import { ILogger } from '../utils/index.js';
export interface ReaderOptions {
    logger?: ILogger;
    extensions: (typeof Extension)[];
    dependencies: {
        [key: string]: unknown;
    };
}
