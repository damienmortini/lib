"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
try {
    try {
        const { output } = require('nx/src/utils/output');
        let workspaceRoot;
        try {
            workspaceRoot = require('nx/src/utils/app-root').workspaceRoot;
        }
        catch (_a) {
            workspaceRoot = require('nx/src/utils/workspace-root').workspaceRoot;
        }
        const { getDependencyConfigs } = require('nx/src/tasks-runner/utils');
        const tasksRunner = require('nx/tasks-runners/default').default;
        const { CompositeLifeCycle } = require('nx/src/tasks-runner/life-cycle');
        let initTasksRunner = null;
        try {
            initTasksRunner = require('nx/src/index').initTasksRunner;
        }
        catch (e) { }
        let cacheDirectory;
        try {
            cacheDirectory = require('nx/src/devkit-exports').cacheDir;
        }
        catch (e) {
            try {
                cacheDirectory = require('nx/src/utils/cache-directory').cacheDir;
            }
            catch (ee) {
                cacheDirectory = (0, path_1.join)(workspaceRoot, './node_modules/.cache/nx');
            }
        }
        exports.cacheDirectory = cacheDirectory;
        exports.runnerReturnsPromise = true;
        exports.output = output;
        exports.workspaceRoot = workspaceRoot;
        exports.tasksRunner = tasksRunner;
        exports.CompositeLifeCycle = CompositeLifeCycle;
        exports.getDependencyConfigs = getDependencyConfigs;
        exports.initTasksRunner = initTasksRunner;
    }
    catch (e) {
        const { output } = require('@nrwl/workspace/src/utilities/output');
        const { appRootPath } = require('@nrwl/tao/src/utils/app-root');
        const { getDependencyConfigs, } = require('@nrwl/workspace/src/tasks-runner/utils');
        const { tasksRunnerV2, } = require('@nrwl/workspace/src/tasks-runner/tasks-runner-v2');
        let CompositeLifeCycle;
        try {
            CompositeLifeCycle =
                require('@nrwl/workspace/src/tasks-runner/life-cycle').CompositeLifeCycle;
        }
        catch (e) { }
        exports.cacheDirectory = (0, path_1.join)(appRootPath, './node_modules/.cache/nx');
        exports.runnerReturnsPromise = false;
        exports.output = output;
        exports.workspaceRoot = appRootPath;
        exports.tasksRunner = tasksRunnerV2;
        exports.CompositeLifeCycle = CompositeLifeCycle;
        exports.getDependencyConfigs = getDependencyConfigs;
        exports.initTasksRunner = null;
    }
}
catch (e) {
    if (process.env.NX_VERBOSE_LOGGING === 'true') {
        console.log(e);
    }
    console.error('NX CLOUD ERROR');
    console.error('---------------------------------------');
    console.error('This version of Nx Cloud is incompatible with the @nrwl/* and @nx/* packages in your workspace, or Nx was not installed properly.');
    console.error('');
    console.error('Verify your install step was successful, and if it was,');
    console.error('match your @nrwl/nx-cloud version to the same major version of your @nx/* and @nrwl/* packages and try again.');
    console.error('---------------------------------------');
    process.exit(1);
}
//# sourceMappingURL=nx-imports.js.map