"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireNx = void 0;
// After Nx v18, this can be removed and replaced with either:
// - import {} from 'nx/src/devkit-exports'
// - import {} from 'nx/src/devkit-internals'
function requireNx() {
    try {
        let result = Object.assign({}, require('nx/src/devkit-exports'));
        try {
            result = Object.assign(Object.assign({}, result), require('nx/src/devkit-internals'));
        }
        catch (_a) { }
        return result;
    }
    catch (_b) {
        // Remove in Nx V17, devkit should not support Nx < 16 at that point.
        return require('./nx-reexports-pre16');
    }
}
exports.requireNx = requireNx;
