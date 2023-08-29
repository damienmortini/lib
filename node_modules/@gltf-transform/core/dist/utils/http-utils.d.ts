/**
 * *Utility class for working with URLs.*
 *
 * @category Utilities
 */
export declare class HTTPUtils {
    static readonly DEFAULT_INIT: RequestInit;
    static readonly PROTOCOL_REGEXP: RegExp;
    static dirname(path: string): string;
    /**
     * Extracts the basename from a URL, e.g. "folder/model.glb" -> "model".
     * See: {@link FileUtils.basename}
     */
    static basename(uri: string): string;
    /**
     * Extracts the extension from a URL, e.g. "folder/model.glb" -> "glb".
     * See: {@link FileUtils.extension}
     */
    static extension(uri: string): string;
    static resolve(base: string, path: string): string;
    /**
     * Returns true for URLs containing a protocol, and false for both
     * absolute and relative paths.
     */
    static isAbsoluteURL(path: string): boolean;
    /**
     * Returns true for paths that are declared relative to some unknown base
     * path. For example, "foo/bar/" is relative both "/foo/bar/" is not.
     */
    static isRelativePath(path: string): boolean;
}
