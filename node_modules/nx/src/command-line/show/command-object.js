"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsShowCommand = void 0;
const tslib_1 = require("tslib");
const yargs_1 = require("yargs");
const shared_options_1 = require("../yargs-utils/shared-options");
exports.yargsShowCommand = {
    command: 'show',
    describe: 'Show information about the workspace (e.g., list of projects)',
    builder: (yargs) => yargs
        .command(showProjectsCommand)
        .command(showProjectCommand)
        .demandCommand()
        .option('json', {
        type: 'boolean',
        description: 'Output JSON',
    })
        .example('$0 show projects', 'Show a list of all projects in the workspace')
        .example('$0 show targets', 'Show a list of all targets in the workspace'),
    handler: (args) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        (0, yargs_1.showHelp)();
        process.exit(1);
    }),
};
const showProjectsCommand = {
    command: 'projects',
    describe: 'Show a list of projects in the workspace',
    builder: (yargs) => (0, shared_options_1.withAffectedOptions)(yargs)
        .option('affected', {
        type: 'boolean',
        description: 'Show only affected projects',
    })
        .option('projects', {
        type: 'string',
        alias: ['p'],
        description: 'Show only projects that match a given pattern.',
        coerce: shared_options_1.parseCSV,
    })
        .option('withTarget', {
        type: 'string',
        alias: ['t'],
        description: 'Show only projects that have a specific target',
    })
        .implies('untracked', 'affected')
        .implies('uncommitted', 'affected')
        .implies('files', 'affected')
        .implies('base', 'affected')
        .implies('head', 'affected')
        .example('$0 show projects --patterns "apps/*"', 'Show all projects in the apps directory')
        .example('$0 show projects --patterns "shared-*"', 'Show all projects that start with "shared-"')
        .example('$0 show projects --affected', 'Show affected projects in the workspace')
        .example('$0 show projects --affected --exclude *-e2e', 'Show affected projects in the workspace, excluding end-to-end projects'),
    handler: (args) => Promise.resolve().then(() => require('./show')).then((m) => m.showProjectsHandler(args)),
};
const showProjectCommand = {
    command: 'project <projectName>',
    describe: 'Show a list of targets in the workspace.',
    builder: (yargs) => yargs
        .positional('projectName', {
        type: 'string',
        alias: 'p',
        description: 'Show targets for the given project',
    })
        .default('json', true)
        .example('$0 show project my-app', 'View project information for my-app in JSON format'),
    handler: (args) => Promise.resolve().then(() => require('./show')).then((m) => m.showProjectHandler(args)),
};
