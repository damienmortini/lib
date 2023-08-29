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
exports.stopAllAgents = void 0;
const stripJsonComments = require("strip-json-comments");
const environment_1 = require("../../utilities/environment");
const print_run_group_error_1 = require("../error/print-run-group-error");
const run_group_api_1 = require("../api/run-group.api");
const fs_1 = require("fs");
const { output } = require('../../utilities/nx-imports');
function stopAllAgents() {
    return __awaiter(this, void 0, void 0, function* () {
        const branch = (0, environment_1.getBranch)();
        const runGroup = (0, environment_1.getRunGroup)();
        const ciExecutionId = (0, environment_1.getCIExecutionId)();
        const ciExecutionEnv = (0, environment_1.getCIExecutionEnv)();
        if (!(0, print_run_group_error_1.canDetectRunGroup)(runGroup, ciExecutionId)) {
            (0, print_run_group_error_1.printRunGroupError)();
            process.exit(1);
        }
        if (environment_1.VERBOSE_LOGGING) {
            output.note({
                title: `Stopping all agents running tasks for run group. branch: ${branch}, ciExecutionId: ${ciExecutionId}, ciExecutionEnv: ${ciExecutionEnv}, runGroup: ${runGroup}`,
            });
        }
        const options = JSON.parse(stripJsonComments((0, fs_1.readFileSync)('nx.json').toString())).tasksRunnerOptions.default.options;
        const api = new run_group_api_1.RunGroupApi(options);
        yield api.completeRunGroup(branch, runGroup, ciExecutionId, ciExecutionEnv);
    });
}
exports.stopAllAgents = stopAllAgents;
//# sourceMappingURL=stop-all-agents.js.map