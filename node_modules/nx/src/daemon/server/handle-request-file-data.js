"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRequestFileData = void 0;
const tslib_1 = require("tslib");
const file_hasher_1 = require("../../hasher/file-hasher");
function handleRequestFileData() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const response = JSON.stringify(file_hasher_1.fileHasher.allFileData());
        return {
            response,
            description: 'handleRequestFileData',
        };
    });
}
exports.handleRequestFileData = handleRequestFileData;
