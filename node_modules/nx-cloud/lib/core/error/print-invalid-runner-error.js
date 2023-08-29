"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printInvalidRunnerError = void 0;
const { output } = require('../../utilities/nx-imports');
function printInvalidRunnerError() {
    output.error({
        title: `Invalid Task Runner Configuration`,
        bodyLines: [
            'To use Distributed Task Execution, your default task runner configuration must',
            'use the "nx-cloud" task runner.',
            '',
            'This can be adjusted in "nx.json".',
        ],
    });
}
exports.printInvalidRunnerError = printInvalidRunnerError;
//# sourceMappingURL=print-invalid-runner-error.js.map