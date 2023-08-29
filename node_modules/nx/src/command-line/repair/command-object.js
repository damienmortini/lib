"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsRepairCommand = void 0;
const tslib_1 = require("tslib");
const documentation_1 = require("../yargs-utils/documentation");
exports.yargsRepairCommand = {
    command: 'repair',
    describe: 'Repair any configuration that is no longer supported by Nx.',
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)(yargs, 'repair').option('verbose', {
        type: 'boolean',
        describe: 'Prints additional information about the commands (e.g., stack traces)',
    }),
    handler: (args) => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return process.exit(yield (yield Promise.resolve().then(() => require('./repair'))).repair(args)); }),
};
