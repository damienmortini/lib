"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashArray = exports.fileHasher = exports.FileHasher = void 0;
const tslib_1 = require("tslib");
const perf_hooks_1 = require("perf_hooks");
const workspace_root_1 = require("../utils/workspace-root");
class FileHasher {
    constructor() {
        this.isInitialized = false;
    }
    init() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            perf_hooks_1.performance.mark('init hashing:start');
            // Import as needed. There is also an issue running unit tests in Nx repo if this is a top-level import.
            const { hashFiles } = require('../native');
            this.clear();
            const filesObject = hashFiles(workspace_root_1.workspaceRoot);
            this.fileHashes = new Map(Object.entries(filesObject));
            perf_hooks_1.performance.mark('init hashing:end');
            perf_hooks_1.performance.measure('init hashing', 'init hashing:start', 'init hashing:end');
        });
    }
    hashFile(path) {
        // Import as needed. There is also an issue running unit tests in Nx repo if this is a top-level import.
        const { hashFile } = require('../native');
        return hashFile(path).hash;
    }
    hashFilesMatchingGlobs(path, globs) {
        // Import as needed. There is also an issue running unit tests in Nx repo if this is a top-level import.
        const { hashFilesMatchingGlobs } = require('../native');
        return hashFilesMatchingGlobs(path, globs);
    }
    clear() {
        this.fileHashes = new Map();
        this.isInitialized = false;
    }
    ensureInitialized() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.isInitialized) {
                yield this.init();
            }
        });
    }
    hashFiles(files) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const r = new Map();
            for (let f of files) {
                r.set(f, this.hashFile(f));
            }
            return r;
        });
    }
    allFileData() {
        const res = [];
        this.fileHashes.forEach((hash, file) => {
            res.push({
                file,
                hash,
            });
        });
        res.sort((x, y) => x.file.localeCompare(y.file));
        return res;
    }
    incrementalUpdate(updatedFiles, deletedFiles = []) {
        perf_hooks_1.performance.mark('incremental hashing:start');
        updatedFiles.forEach((hash, filename) => {
            this.fileHashes.set(filename, hash);
        });
        for (const deletedFile of deletedFiles) {
            this.fileHashes.delete(deletedFile);
        }
        perf_hooks_1.performance.mark('incremental hashing:end');
        perf_hooks_1.performance.measure('incremental hashing', 'incremental hashing:start', 'incremental hashing:end');
    }
}
exports.FileHasher = FileHasher;
exports.fileHasher = new FileHasher();
function hashArray(content) {
    // Import as needed. There is also an issue running unit tests in Nx repo if this is a top-level import.
    const { hashArray } = require('../native');
    return hashArray(content);
}
exports.hashArray = hashArray;
