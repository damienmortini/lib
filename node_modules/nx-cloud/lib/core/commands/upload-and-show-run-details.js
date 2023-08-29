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
exports.uploadAndShowRunDetails = void 0;
const fs_1 = require("fs");
const open = require("open");
const path_1 = require("path");
const environment_1 = require("../../utilities/environment");
const cloud_run_api_1 = require("../runners/cloud-enabled/cloud-run.api");
const id_generator_1 = require("../runners/cloud-enabled/id-generator");
const message_reporter_1 = require("../terminal-output/message-reporter");
const output_obfuscator_1 = require("../terminal-output/output-obfuscator");
const read_task_terminal_output_1 = require("../terminal-output/read-task-terminal-output");
const stripJsonComments = require("strip-json-comments");
const remove_trailing_slash_1 = require("../../utilities/remove-trailing-slash");
const print_cloud_connection_disabled_message_1 = require("../../utilities/print-cloud-connection-disabled-message");
const { workspaceRoot, output, cacheDirectory, } = require('../../utilities/nx-imports');
function uploadRunDetails(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const errors = new message_reporter_1.MessageReporter(options);
        const runContext = {};
        const machineInfo = (0, environment_1.getMachineInfo)(options);
        const api = new cloud_run_api_1.CloudRunApi(errors, runContext, options, machineInfo);
        const outputObfusactor = new output_obfuscator_1.OutputObfuscator(options.maskedProperties);
        const runInfo = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(cacheDirectory, 'run.json')).toString());
        // we need to connect to cloud if not connected yet
        const tasks = runInfo.tasks.map((t) => (Object.assign(Object.assign({}, t), { terminalOutput: (0, read_task_terminal_output_1.readTaskTerminalOutput)(cacheDirectory, outputObfusactor, t.hash, t.cacheStatus, t.status) })));
        const linkId = (0, id_generator_1.generateUniqueLinkId)();
        yield api.endRun(runInfo.run, tasks, {
            branch: null,
            runGroup: null,
            ciExecutionId: null,
            ciExecutionEnv: null,
        }, linkId);
        return `${(0, remove_trailing_slash_1.removeTrailingSlash)(options.url || 'https://nx.app')}/runs/${linkId}`;
    });
}
function uploadAndShowRunDetails() {
    return __awaiter(this, void 0, void 0, function* () {
        const nxJson = readNxJson();
        if (nxJson.neverConnectToCloud) {
            (0, print_cloud_connection_disabled_message_1.printCloudConnectionDisabledMessage)();
            process.exit(1);
        }
        const options = readOptions(nxJson);
        const url = yield uploadRunDetails(options);
        output.success({
            title: 'Successfully uploaded the run details',
            bodyLines: [`View run details at ${url}`],
        });
        open(url);
    });
}
exports.uploadAndShowRunDetails = uploadAndShowRunDetails;
function readNxJson() {
    try {
        return JSON.parse(stripJsonComments((0, fs_1.readFileSync)((0, path_1.join)(workspaceRoot, 'nx.json')).toString()));
    }
    catch (e) {
        return {};
    }
}
function readOptions(nxJson) {
    var _a, _b;
    return (_b = (_a = nxJson === null || nxJson === void 0 ? void 0 : nxJson.tasksRunnerOptions) === null || _a === void 0 ? void 0 : _a.default) === null || _b === void 0 ? void 0 : _b.options;
}
//# sourceMappingURL=upload-and-show-run-details.js.map