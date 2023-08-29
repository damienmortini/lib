"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printRunGroupError = exports.canDetectRunGroup = void 0;
const { output } = require('../../utilities/nx-imports');
function canDetectRunGroup(runGroup, ciExecutionId) {
    return !!runGroup || !!ciExecutionId;
}
exports.canDetectRunGroup = canDetectRunGroup;
function printRunGroupError() {
    output.error({
        title: `Unable to determine the context for running Nx in CI`,
        bodyLines: [
            "- Nx tried to determine the context automatically but wasn't able to do it.",
            '- Use the NX_CI_EXECUTION_ID env variable to set it manually.',
            `- NX_CI_EXECUTION_ID must be a unique value for every CI execution/run.`,
        ],
    });
}
exports.printRunGroupError = printRunGroupError;
//# sourceMappingURL=print-run-group-error.js.map