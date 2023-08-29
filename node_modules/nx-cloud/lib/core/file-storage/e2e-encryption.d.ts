/// <reference types="node" />
export declare class E2EEncryption {
    encryptionKey: Buffer | undefined;
    constructor(key: string | undefined);
    private to32bytes;
    hasEncryption(): boolean;
    encryptFile(file: string): void;
    decryptFile(file: string): void;
}
