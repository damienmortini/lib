"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsRunManyCommand = void 0;
const tslib_1 = require("tslib");
const documentation_1 = require("../yargs-utils/documentation");
const shared_options_1 = require("../yargs-utils/shared-options");
exports.yargsRunManyCommand = {
    command: 'run-many',
    describe: 'Run target for multiple listed projects',
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)((0, shared_options_1.withRunManyOptions)((0, shared_options_1.withOutputStyleOption)((0, shared_options_1.withTargetAndConfigurationOption)(yargs))), 'run-many'),
    handler: (args) => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return (yield Promise.resolve().then(() => require('./run-many'))).runMany((0, shared_options_1.withOverrides)(args)); }),
};
