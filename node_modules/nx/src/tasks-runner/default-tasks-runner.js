"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTasksRunner = void 0;
const tslib_1 = require("tslib");
const task_orchestrator_1 = require("./task-orchestrator");
const defaultTasksRunner = (tasks, options, context) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    if (options['parallel'] === 'false' ||
        options['parallel'] === false) {
        options['parallel'] = 1;
    }
    else if (options['parallel'] === 'true' ||
        options['parallel'] === true ||
        options['parallel'] === undefined ||
        options['parallel'] === '') {
        options['parallel'] = Number(options['maxParallel'] || 3);
    }
    options.lifeCycle.startCommand();
    try {
        return yield runAllTasks(tasks, options, context);
    }
    finally {
        options.lifeCycle.endCommand();
    }
});
exports.defaultTasksRunner = defaultTasksRunner;
function runAllTasks(tasks, options, context) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const orchestrator = new task_orchestrator_1.TaskOrchestrator(context.hasher, context.initiatingProject, context.projectGraph, context.taskGraph, options, (_a = context.nxArgs) === null || _a === void 0 ? void 0 : _a.nxBail, context.daemon);
        return orchestrator.run();
    });
}
exports.default = exports.defaultTasksRunner;
