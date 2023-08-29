"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DteArtifactStorage = void 0;
const environment_1 = require("./environment");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const { output, workspaceRoot } = require('./nx-imports');
class DteArtifactStorage {
    constructor(fileStorage, cacheDirectory) {
        this.fileStorage = fileStorage;
        this.cacheDirectory = cacheDirectory;
        (0, fs_extra_1.mkdirSync)(cacheDirectory, { recursive: true });
    }
    retrieveAndExtract(hash, url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (environment_1.VERBOSE_LOGGING) {
                output.note({
                    title: `Retrieving artifacts from ${url}`,
                });
            }
            yield this.fileStorage.retrieve(hash, url, this.cacheDirectory);
            if (environment_1.VERBOSE_LOGGING) {
                output.note({
                    title: `Extracting artifacts`,
                });
            }
            const outputs = (0, path_1.join)(this.cacheDirectory, hash, 'outputs');
            yield (0, fs_extra_1.copy)(outputs, workspaceRoot);
            return (yield (0, fs_extra_1.readFile)((0, path_1.join)(this.cacheDirectory, hash, 'terminalOutput'))).toString();
        });
    }
}
exports.DteArtifactStorage = DteArtifactStorage;
//# sourceMappingURL=dte-artifact-storage.js.map