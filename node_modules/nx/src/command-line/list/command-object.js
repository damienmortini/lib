"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsListCommand = void 0;
const tslib_1 = require("tslib");
exports.yargsListCommand = {
    command: 'list [plugin]',
    describe: 'Lists installed plugins, capabilities of installed plugins and other available plugins.',
    builder: (yargs) => yargs.positional('plugin', {
        type: 'string',
        description: 'The name of an installed plugin to query',
    }),
    handler: (args) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => require('./list'))).listHandler(args);
        process.exit(0);
    }),
};
