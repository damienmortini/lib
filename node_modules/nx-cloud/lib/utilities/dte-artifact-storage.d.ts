import { FileStorage } from '../core/file-storage/file-storage';
export declare class DteArtifactStorage {
    private readonly fileStorage;
    private readonly cacheDirectory;
    constructor(fileStorage: FileStorage, cacheDirectory: string);
    retrieveAndExtract(hash: string, url: string): Promise<string>;
}
