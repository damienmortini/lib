"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsDaemonCommand = void 0;
const tslib_1 = require("tslib");
const documentation_1 = require("../yargs-utils/documentation");
exports.yargsDaemonCommand = {
    command: 'daemon',
    describe: 'Prints information about the Nx Daemon process or starts a daemon process',
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)(withDaemonOptions(yargs), 'daemon'),
    handler: (args) => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return (yield Promise.resolve().then(() => require('./daemon'))).daemonHandler(args); }),
};
function withDaemonOptions(yargs) {
    return yargs
        .option('start', {
        type: 'boolean',
        default: false,
    })
        .option('stop', {
        type: 'boolean',
        default: false,
    });
}
