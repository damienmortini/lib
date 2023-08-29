/**
 * *Utility class for working with file systems and URI paths.*
 *
 * @category Utilities
 */
export declare class FileUtils {
    /**
     * Extracts the basename from a file path, e.g. "folder/model.glb" -> "model".
     * See: {@link HTTPUtils.basename}
     */
    static basename(uri: string): string;
    /**
     * Extracts the extension from a file path, e.g. "folder/model.glb" -> "glb".
     * See: {@link HTTPUtils.extension}
     */
    static extension(uri: string): string;
}
