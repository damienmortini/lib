export interface CacheUrls {
    [hash: string]: {
        get: string;
        put: string;
    };
}
