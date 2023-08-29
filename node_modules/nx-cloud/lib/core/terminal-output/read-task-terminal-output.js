"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readTaskTerminalOutput = void 0;
const path_1 = require("path");
const { workspaceRoot } = require('../../utilities/nx-imports');
const environment_1 = require("../../utilities/environment");
const fs_1 = require("fs");
const path = require("path");
const MAX_CHARACTERS_FAILED_TASK = 200000;
const MAX_CHARACTERS_SUCCESSFUL_TASK = 20000;
const MAX_CHARACTERS_CACHED_TASK = 20000;
function readTaskTerminalOutput(cacheDirectory, outputObfuscator, hash, cacheStatus, code) {
    let dir;
    if (cacheDirectory) {
        if (cacheDirectory.startsWith('./')) {
            dir = (0, path_1.join)(workspaceRoot, cacheDirectory);
        }
        else {
            dir = cacheDirectory;
        }
    }
    else {
        dir = (0, path_1.join)(workspaceRoot, 'node_modules', '.cache', 'nx');
    }
    try {
        const taskOutput = readTerminalOutputFile(dir, hash);
        const taskOutputSanitized = outputObfuscator.obfuscate(taskOutput);
        if (environment_1.NX_CLOUD_UNLIMITED_OUTPUT)
            return taskOutputSanitized;
        const maxCharacters = cacheStatus === 'cache-miss'
            ? code === 0
                ? MAX_CHARACTERS_SUCCESSFUL_TASK
                : MAX_CHARACTERS_FAILED_TASK
            : MAX_CHARACTERS_CACHED_TASK;
        return taskOutputSanitized.length > maxCharacters
            ? `TRUNCATED\n\n${taskOutputSanitized.slice(taskOutputSanitized.length - maxCharacters)}`
            : taskOutputSanitized;
    }
    catch (e) {
        if (process.env.NX_VERBOSE_LOGGING === 'true') {
            console.error(e);
        }
        return '';
    }
}
exports.readTaskTerminalOutput = readTaskTerminalOutput;
function readTerminalOutputFile(dir, hash) {
    try {
        return (0, fs_1.readFileSync)(path.join(dir, 'terminalOutputs', hash)).toString();
    }
    catch (_a) {
        try {
            return (0, fs_1.readFileSync)(path.join(dir, hash, 'terminalOutput')).toString();
        }
        catch (_b) {
            return '';
        }
    }
}
//# sourceMappingURL=read-task-terminal-output.js.map