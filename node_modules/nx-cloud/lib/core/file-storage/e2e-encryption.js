"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.E2EEncryption = void 0;
const fs_1 = require("fs");
const crypto_1 = require("crypto");
class E2EEncryption {
    constructor(key) {
        if (key) {
            this.encryptionKey = this.to32bytes(key);
        }
    }
    to32bytes(key) {
        let res = key;
        while (res.length < 32) {
            res += key;
        }
        return Buffer.from(res).slice(0, 32);
    }
    hasEncryption() {
        return !!this.encryptionKey;
    }
    encryptFile(file) {
        const iv = (0, crypto_1.randomBytes)(16);
        const cipher = (0, crypto_1.createCipheriv)('aes-256-cbc', this.encryptionKey, iv);
        const decryptedFileContents = (0, fs_1.readFileSync)(file);
        const e = cipher.update(decryptedFileContents);
        const encryptedFileContents = Buffer.concat([iv, e, cipher.final()]);
        (0, fs_1.writeFileSync)(file, encryptedFileContents);
    }
    decryptFile(file) {
        const encryptedFileContents = (0, fs_1.readFileSync)(file);
        try {
            const decipher = (0, crypto_1.createDecipheriv)('aes-256-cbc', this.encryptionKey, encryptedFileContents.slice(0, 16) // iv
            );
            const encryptedText = encryptedFileContents.slice(16); // remove the iv
            const d = decipher.update(encryptedText);
            const decryptedFileContents = Buffer.concat([d, decipher.final()]);
            (0, fs_1.writeFileSync)(file, decryptedFileContents);
        }
        catch (e) {
            throw new Error(`Could not decrypt the artifact. Please check your encryption key.`);
        }
    }
}
exports.E2EEncryption = E2EEncryption;
//# sourceMappingURL=e2e-encryption.js.map