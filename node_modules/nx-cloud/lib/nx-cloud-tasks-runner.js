"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const environment_1 = require("./utilities/environment");
const cloud_enabled_runner_1 = require("./core/runners/cloud-enabled/cloud-enabled.runner");
const distributed_task_execution_detection_1 = require("./utilities/distributed-task-execution-detection");
const is_workspace_enabled_1 = require("./utilities/is-workspace-enabled");
const { tasksRunner, output, runnerReturnsPromise, } = require('./utilities/nx-imports');
const nxCloudTasksRunner = (tasks, options, context = {}) => {
    const nxArgs = context.nxArgs || {};
    const noAccessTokenDefined = !environment_1.ACCESS_TOKEN && !options.accessToken;
    const noCloud = nxArgs['cloud'] === false || environment_1.NX_NO_CLOUD;
    if (noAccessTokenDefined || noCloud || options.skipNxCache) {
        if (noAccessTokenDefined) {
            output.warn({
                title: 'No access token found',
                bodyLines: [
                    'Nx will continue running, but nothing will be written or read from the remote cache.',
                    'Run details will also not be available in the Nx Cloud UI.',
                ],
            });
        }
        if (noCloud) {
            output.warn({
                title: 'Nx Cloud Manually Disabled',
                bodyLines: [
                    'Nx will continue running, but nothing will be written or read from the remote cache.',
                    'Run details will also not be available in the Nx Cloud UI.',
                    '',
                    "If this wasn't intentional, check for the NX_NO_CLOUD environment variable, the --no-cloud flag",
                ],
            });
        }
        if (options.skipNxCache) {
            output.warn({
                title: '--skip-nx-cache disables the connection to Nx Cloud for the current run.',
                bodyLines: [
                    'The remote cache will not be read from or written to during this run.',
                ],
            });
        }
        return tasksRunner(tasks, options, context);
    }
    if ((0, environment_1.nxInvokedByRunner)()) {
        if (anyCacheableTargets(tasks, options)) {
            return (0, cloud_enabled_runner_1.cloudEnabledTasksRunner)(tasks, options, context, true);
        }
        else {
            return tasksRunner(tasks, options, context);
        }
    }
    if ((0, environment_1.agentRunningInDistributedExecution)(process.env.NX_CLOUD_DISTRIBUTED_EXECUTION_ID)) {
        verifyAllOperationsAreCacheableOnAgent(tasks, options);
    }
    // distributed execution, main job
    if ((0, distributed_task_execution_detection_1.isDistributedExecutionEnabled)(nxArgs['dte']) &&
        !(0, environment_1.agentRunningInDistributedExecution)(process.env.NX_CLOUD_DISTRIBUTED_EXECUTION_ID)) {
        verifyAllOperationsAreCacheableOnMainJob(tasks, options);
        if (runnerReturnsPromise) {
            return dtePromiseVersion(tasks, options, context);
        }
        else {
            return dteLegacyObservableVersion(tasks, options, context);
        }
    }
    // This disables using Cloud for all inner nx invocations, so it won't create an extra run.
    process.env.NX_INVOKED_BY_RUNNER = 'true';
    return (0, cloud_enabled_runner_1.cloudEnabledTasksRunner)(tasks, options, context);
};
function dteLegacyObservableVersion(tasks, options, context) {
    const { from } = require('rxjs/internal/observable/from');
    const { switchMap } = require('rxjs/internal/operators/switchMap');
    return from((0, is_workspace_enabled_1.isWorkspaceEnabled)(options)).pipe(switchMap((res) => {
        if (res.data.enabled) {
            return require('./core/runners/distributed-execution/distributed-execution.runner').nxCloudDistributedTasksRunner(tasks, options, context);
        }
        output.warn({
            title: 'Nx Cloud: Workspace Disabled',
            bodyLines: [
                'This run and following runs will not use distributed task execution until',
                'the outstanding balance is paid or additional coupons are added for this',
                'workspace. If you believe you are receiving this message in error, please',
                'contact support at cloud-support@nrwl.io.',
                '',
                'Execution will now continue using this machine only.',
            ],
        });
        // This disables using Cloud for all inner nx invocations, so it won't create an extra run.
        process.env.NX_INVOKED_BY_RUNNER = 'true';
        return (0, cloud_enabled_runner_1.cloudEnabledTasksRunner)(tasks, options, context);
    }));
}
function dtePromiseVersion(tasks, options, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const isEnabled = yield (0, is_workspace_enabled_1.isWorkspaceEnabled)(options);
        if (isEnabled.data.enabled) {
            return require('./core/runners/distributed-execution/distributed-execution.runner').nxCloudDistributedTasksRunner(tasks, options, context);
        }
        else {
            output.warn({
                title: 'Nx Cloud: Workspace Disabled',
                bodyLines: [
                    'This run and following runs will not use distributed task execution until',
                    'the outstanding balance is paid.',
                    '',
                    'If you believe you are receiving this message in error, please',
                    'contact support at cloud-support@nrwl.io.',
                    '',
                    'Execution will now continue using this machine only.',
                ],
            });
            // This disables using Cloud for all inner nx invocations, so it won't create an extra run.
            process.env.NX_INVOKED_BY_RUNNER = 'true';
            return (0, cloud_enabled_runner_1.cloudEnabledTasksRunner)(tasks, options, context);
        }
    });
}
function anyCacheableTargets(tasks, options) {
    const cacheableTargets = options.cacheableOperations || [];
    for (const task of tasks) {
        if (cacheableTargets.indexOf(task.target.target) > -1) {
            return true;
        }
    }
    return false;
}
function verifyAllOperationsAreCacheableOnMainJob(tasks, options) {
    const cacheableTargets = options.cacheableOperations || [];
    for (const task of tasks) {
        if (cacheableTargets.indexOf(task.target.target) === -1) {
            output.error({
                title: `Distributed task execution only works for cacheable targets`,
                bodyLines: [
                    `Target '${task.target.project}:${task.target.target}' cannot be executed.`,
                    `To be able to replay the output of the target, distributed task execution only supports cacheable targets.`,
                    `You can verify that '${task.target.target}' is part of the list of cacheable targets in the 'nx.json' file.`,
                    `You can invoke this command without distribution by doing "NX_CLOUD_DISTRIBUTED_EXECUTION=false nx ...".`,
                ],
            });
            process.exit(1);
        }
    }
}
function verifyAllOperationsAreCacheableOnAgent(tasks, options) {
    const cacheableTargets = options.cacheableOperations || [];
    tasks.forEach((task) => {
        if (cacheableTargets.indexOf(task.target.target) === -1) {
            output.error({
                title: `Distributed task execution only works for cacheable targets`,
                bodyLines: [
                    `Target ${task.target.project}:${task.target.target} cannot be executed.`,
                    `To be able to replay the output of the target, distributed task execution only supports cacheable targets.`,
                    `You can still invoke "nx ${task.target.target} ${task.target.project}" from within a cacheable target when using "nx:run-commands".`,
                ],
            });
            process.exit(environment_1.DISTRIBUTED_TASK_EXECUTION_INTERNAL_ERROR_STATUS_CODE);
        }
    });
}
exports.default = nxCloudTasksRunner;
//# sourceMappingURL=nx-cloud-tasks-runner.js.map