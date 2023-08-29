"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsWorkspaceLintCommand = void 0;
const tslib_1 = require("tslib");
/**
 * @deprecated workspace-lint is deprecated, and will be removed in v17. The checks it used to perform are no longer relevant.
 */
exports.yargsWorkspaceLintCommand = {
    command: 'workspace-lint [files..]',
    describe: 'Lint nx specific workspace files (nx.json, workspace.json)',
    deprecated: 'workspace-lint is deprecated, and will be removed in v17. The checks it used to perform are no longer relevant.  See: https://nx.dev/deprecated/workspace-lint',
    handler: () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => require('./workspace-lint'))).workspaceLint();
        process.exit(0);
    }),
};
