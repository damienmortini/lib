"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDistributedExecutionEnabled = exports.storeDteMarker = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const fs_1 = require("fs");
const nxCacheDirectory = process.env.NX_CACHE_DIRECTORY
    ? [process.env['NX_CACHE_DIRECTORY']]
    : ['node_modules', '.cache', 'nx'];
const dir = (0, path_1.join)(process.cwd(), ...nxCacheDirectory);
const dteMarker = (0, path_1.join)(dir, 'NX_CLOUD_DISTRIBUTED_EXECUTION');
function storeDteMarker() {
    (0, fs_extra_1.ensureDirSync)(dir);
    (0, fs_extra_1.writeFileSync)(dteMarker, 'true');
}
exports.storeDteMarker = storeDteMarker;
function isDistributedExecutionEnabled(explicitOption) {
    if (explicitOption === true)
        return true;
    if (explicitOption === false)
        return false;
    const envVar = process.env.NX_CLOUD_DISTRIBUTED_EXECUTION;
    if (envVar === 'false' || envVar === 'FALSE' || envVar === '0')
        return false;
    if (envVar === 'true' || envVar === 'TRUE' || envVar === '1')
        return true;
    try {
        (0, fs_1.readFileSync)(dteMarker);
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.isDistributedExecutionEnabled = isDistributedExecutionEnabled;
//# sourceMappingURL=distributed-task-execution-detection.js.map