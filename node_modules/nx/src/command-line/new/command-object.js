"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsNewCommand = void 0;
const tslib_1 = require("tslib");
exports.yargsNewCommand = {
    command: 'new [_..]',
    describe: false,
    builder: (yargs) => withNewOptions(yargs),
    handler: (args) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        args._ = args._.slice(1);
        process.exit(yield (yield Promise.resolve().then(() => require('./new'))).newWorkspace(args['nxWorkspaceRoot'], args));
    }),
};
function withNewOptions(yargs) {
    return yargs
        .option('nxWorkspaceRoot', {
        describe: 'The folder where the new workspace is going to be created',
        type: 'string',
        required: true,
    })
        .option('interactive', {
        describe: 'When false disables interactive input prompts for options',
        type: 'boolean',
        default: true,
    });
}
