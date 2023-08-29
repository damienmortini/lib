"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsFormatWriteCommand = exports.yargsFormatCheckCommand = void 0;
const tslib_1 = require("tslib");
const documentation_1 = require("../yargs-utils/documentation");
const shared_options_1 = require("../yargs-utils/shared-options");
exports.yargsFormatCheckCommand = {
    command: 'format:check',
    describe: 'Check for un-formatted files',
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)(withFormatOptions(yargs), 'format:check'),
    handler: (args) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => require('./format'))).format('check', args);
        process.exit(0);
    }),
};
exports.yargsFormatWriteCommand = {
    command: 'format:write',
    describe: 'Overwrite un-formatted files',
    aliases: ['format'],
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)(withFormatOptions(yargs), 'format:write'),
    handler: (args) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => require('./format'))).format('write', args);
        process.exit(0);
    }),
};
function withFormatOptions(yargs) {
    return (0, shared_options_1.withAffectedOptions)(yargs)
        .parserConfiguration({
        'camel-case-expansion': true,
    })
        .option('libs-and-apps', {
        describe: 'Format only libraries and applications files.',
        type: 'boolean',
    })
        .option('projects', {
        describe: 'Projects to format (comma/space delimited)',
        type: 'string',
        coerce: shared_options_1.parseCSV,
    })
        .option('all', {
        describe: 'Format all projects',
        type: 'boolean',
    })
        .conflicts({
        all: 'projects',
    });
}
