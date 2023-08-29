"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printMessage = void 0;
const { output } = require('./nx-imports');
function printMessage(message) {
    if (newTerminalOutput()) {
        process.stdout.write(`   ${formatMessage(message)}`);
        output.addNewline();
        output.addNewline();
    }
    else {
        if (runOneCommand()) {
            output.addNewline();
            process.stdout.write(`${formatMessage(message)}`);
            output.addNewline();
            output.addNewline();
        }
        else {
            process.stdout.write(`  ${formatMessage(message)}`);
            output.addNewline();
            output.addNewline();
        }
    }
}
exports.printMessage = printMessage;
function newTerminalOutput() {
    try {
        require('nx/src/tasks-runner/life-cycles/dynamic-run-many-terminal-output-life-cycle');
        return true;
    }
    catch (e) {
        try {
            require('@nrwl/workspace/src/tasks-runner/life-cycles/dynamic-run-many-terminal-output-life-cycle');
            return true;
        }
        catch (ee) {
            return false;
        }
    }
}
function formatMessage(message) {
    let formattedMessage;
    // TODO(Altan): Remove after Nx 15-ish
    // output.dim causes incompatibility with older versions of Nx, so fall back
    // to old method if function is undefined
    if (typeof output.dim === 'function') {
        return output.dim(message);
    }
    else {
        try {
            // Old (pre 13.4/13.5) method
            return output.colors.gray(message);
        }
        catch (e) {
            // Ultra fallback, we should never hit this
            return message;
        }
    }
}
function runOneCommand() {
    return (process.argv.indexOf('run-many') === -1 &&
        process.argv.indexOf('affected') === -1);
}
//# sourceMappingURL=print-message.js.map