import { Format, VertexLayout } from '../constants.js';
import type { Extension } from '../extension.js';
import { Logger } from '../utils/index.js';
export interface WriterOptions {
    format: Format;
    logger?: Logger;
    basename?: string;
    vertexLayout?: VertexLayout;
    dependencies?: {
        [key: string]: unknown;
    };
    extensions?: (typeof Extension)[];
}
