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
exports.startCiRun = void 0;
const stripJsonComments = require("strip-json-comments");
const environment_1 = require("../../utilities/environment");
const print_run_group_error_1 = require("../error/print-run-group-error");
const run_group_api_1 = require("../api/run-group.api");
const fs_1 = require("fs");
const yargsParser = require("yargs-parser");
const distributed_task_execution_detection_1 = require("../../utilities/distributed-task-execution-detection");
const { output, workspaceRoot } = require('../../utilities/nx-imports');
const args = yargsParser(process.argv, {
    boolean: ['stop-agents-on-failure', 'use-dte-by-default'],
    number: ['agent-count', 'command-count'],
    string: ['stop-agents-after'],
    default: {
        useDteByDefault: true,
    },
});
function startCiRun() {
    return __awaiter(this, void 0, void 0, function* () {
        const branch = (0, environment_1.getBranch)();
        const runGroup = (0, environment_1.getRunGroup)();
        const ciExecutionId = (0, environment_1.getCIExecutionId)();
        const ciExecutionEnv = (0, environment_1.getCIExecutionEnv)();
        const commitSha = (0, environment_1.extractGitSha)();
        const commitRef = (0, environment_1.extractGitRef)();
        if (!(0, print_run_group_error_1.canDetectRunGroup)(runGroup, ciExecutionId)) {
            (0, print_run_group_error_1.printRunGroupError)();
            process.exit(1);
        }
        if (environment_1.VERBOSE_LOGGING) {
            output.note({
                title: `Creating run group. branch: ${branch}, ciExecutionId: ${ciExecutionId}, ciExecutionEnv: ${ciExecutionEnv}, runGroup: ${runGroup}, commitSha: ${commitSha}`,
            });
        }
        if (args.commandCount) {
            output.error({
                title: `--command-count is deprecated. Use --stop-agents-after instead.`,
                bodyLines: [`E.g., npx nx-cloud start-ci-run --stop-agents-after="e2e"`],
            });
            process.exit(1);
        }
        const options = JSON.parse(stripJsonComments((0, fs_1.readFileSync)(`${workspaceRoot}/nx.json`).toString())).tasksRunnerOptions.default.options;
        const api = new run_group_api_1.RunGroupApi(options);
        yield api.createRunGroup(branch, runGroup, ciExecutionId, ciExecutionEnv, args.stopAgentsOnFailure, args.agentCount, args.stopAgentsAfter, commitSha, commitRef);
        if (args.useDteByDefault) {
            (0, distributed_task_execution_detection_1.storeDteMarker)();
        }
    });
}
exports.startCiRun = startCiRun;
//# sourceMappingURL=start-ci-run.js.map