"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsViewLogsCommand = exports.yargsConnectCommand = void 0;
const tslib_1 = require("tslib");
const documentation_1 = require("../yargs-utils/documentation");
exports.yargsConnectCommand = {
    command: 'connect',
    aliases: ['connect-to-nx-cloud'],
    describe: `Connect workspace to Nx Cloud`,
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)(yargs, 'connect-to-nx-cloud'),
    handler: () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => require('./connect-to-nx-cloud'))).connectToNxCloudCommand();
        process.exit(0);
    }),
};
exports.yargsViewLogsCommand = {
    command: 'view-logs',
    describe: 'Enables you to view and interact with the logs via the advanced analytic UI from Nx Cloud to help you debug your issue. To do this, Nx needs to connect your workspace to Nx Cloud and upload the most recent run details. Only the metrics are uploaded, not the artefacts.',
    handler: () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return process.exit(yield (yield Promise.resolve().then(() => require('./view-logs'))).viewLogs()); }),
};
