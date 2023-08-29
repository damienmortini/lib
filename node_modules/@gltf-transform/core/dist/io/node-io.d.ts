import type { Document } from '../document.js';
import { PlatformIO } from './platform-io.js';
/**
 * *I/O service for Node.js.*
 *
 * The most common use of the I/O service is to read/write a {@link Document} with a given path.
 * Methods are also available for converting in-memory representations of raw glTF files, both
 * binary (*Uint8Array*) and JSON ({@link JSONDocument}).
 *
 * Usage:
 *
 * ```typescript
 * import { NodeIO } from '@gltf-transform/core';
 *
 * const io = new NodeIO();
 *
 * // Read.
 * let document;
 * document = await io.read('model.glb'); // → Document
 * document = await io.readBinary(glb);   // Uint8Array → Document
 *
 * // Write.
 * await io.write('model.glb', document);      // → void
 * const glb = await io.writeBinary(document); // Document → Uint8Array
 * ```
 *
 * By default, NodeIO can only read/write paths on disk. To enable HTTP requests, provide a Fetch
 * API implementation (such as [`node-fetch`](https://www.npmjs.com/package/node-fetch)) and enable
 * {@link NodeIO.setAllowHTTP setAllowHTTP}. HTTP requests may optionally be configured with
 * [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters) parameters.
 *
 * ```typescript
 * import fetch from 'node-fetch';
 *
 * const io = new NodeIO(fetch, {headers: {...}}).setAllowHTTP(true);
 *
 * const document = await io.read('https://example.com/path/to/model.glb');
 * ```
 *
 * @category I/O
 */
export declare class NodeIO extends PlatformIO {
    private _fs;
    private _path;
    private readonly _fetch;
    private readonly _fetchConfig;
    private _init;
    private _fetchEnabled;
    /**
     * Constructs a new NodeIO service. Instances are reusable. By default, only NodeIO can only
     * read/write paths on disk. To enable HTTP requests, provide a Fetch API implementation and
     * enable {@link NodeIO.setAllowHTTP setAllowHTTP}.
     *
     * @param fetch Implementation of Fetch API.
     * @param fetchConfig Configuration object for Fetch API.
     */
    constructor(_fetch?: unknown, _fetchConfig?: RequestInit);
    init(): Promise<void>;
    setAllowHTTP(allow: boolean): this;
    protected readURI(uri: string, type: 'view'): Promise<Uint8Array>;
    protected readURI(uri: string, type: 'text'): Promise<string>;
    protected resolve(base: string, path: string): string;
    protected dirname(uri: string): string;
    /**********************************************************************************************
     * Public.
     */
    /** Writes a {@link Document} instance to a local path. */
    write(uri: string, doc: Document): Promise<void>;
}
