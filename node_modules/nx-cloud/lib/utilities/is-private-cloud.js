"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isConnectedToPrivateCloud = void 0;
const stripJsonComments = require("strip-json-comments");
const fs_1 = require("fs");
const path_1 = require("path");
const { workspaceRoot } = require('./nx-imports');
function isConnectedToPrivateCloud() {
    const options = readOptions();
    if (!options.url)
        return false;
    if (options.useLatestApi)
        return false;
    if (options.url.endsWith('snapshot.nx.app'))
        return true;
    if (options.url.endsWith('.nx.app'))
        return false;
    if (options.url.indexOf('localhost') > -1)
        return false;
    return true;
}
exports.isConnectedToPrivateCloud = isConnectedToPrivateCloud;
function readOptions() {
    var _a, _b, _c;
    try {
        return (_c = (_b = (_a = JSON.parse(stripJsonComments((0, fs_1.readFileSync)((0, path_1.join)(workspaceRoot, 'nx.json')).toString()))) === null || _a === void 0 ? void 0 : _a.tasksRunnerOptions) === null || _b === void 0 ? void 0 : _b.default) === null || _c === void 0 ? void 0 : _c.options;
    }
    catch (e) {
        return {};
    }
}
//# sourceMappingURL=is-private-cloud.js.map