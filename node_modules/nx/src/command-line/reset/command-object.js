"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsResetCommand = void 0;
const tslib_1 = require("tslib");
exports.yargsResetCommand = {
    command: 'reset',
    describe: 'Clears all the cached Nx artifacts and metadata about the workspace and shuts down the Nx Daemon.',
    aliases: ['clear-cache'],
    handler: () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return (yield Promise.resolve().then(() => require('./reset'))).resetHandler(); }),
};
