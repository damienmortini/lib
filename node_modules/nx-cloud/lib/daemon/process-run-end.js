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
const file_storage_1 = require("../core/file-storage/file-storage");
const cloud_run_api_1 = require("../core/runners/cloud-enabled/cloud-run.api");
const error_reporter_api_1 = require("../core/api/error-reporter.api");
const e2e_encryption_1 = require("../core/file-storage/e2e-encryption");
const environment_1 = require("../utilities/environment");
const message_reporter_1 = require("../core/terminal-output/message-reporter");
const metric_logger_1 = require("../utilities/metric-logger");
const { cacheDirectory } = require('../utilities/nx-imports');
function processRunEnd(data, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const encryption = new e2e_encryption_1.E2EEncryption(data.encryptionKey);
        const errorApi = new error_reporter_api_1.ErrorReporterApi(data.runnerOptions);
        const fileStorage = new file_storage_1.FileStorage(encryption, errorApi, data.runnerOptions, 'daemon');
        const reporter = new message_reporter_1.MessageReporter(data.runnerOptions);
        const runContext = {};
        const machineInfo = (0, environment_1.getMachineInfo)(data.runnerOptions);
        const api = new cloud_run_api_1.CloudRunApi(reporter, runContext, data.runnerOptions, machineInfo);
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            logger.log('Uploading file artifacts');
            try {
                yield Promise.all(data.delayedStoreRequests.map((t) => fileStorage.store(t.hash, t.url, cacheDirectory)));
                logger.log('Done uploading file artifacts');
            }
            catch (e) {
                logger.log('Error when uploading file artifacts');
                console.log(e);
                return;
            }
            for (const hash of fileStorage.storedHashes) {
                const matchingTask = data.runEnd.taskExecutions.find((t) => t.hash === hash);
                if (!matchingTask) {
                    throw new Error(`Task with hash ${hash} isn't recorded`);
                }
                matchingTask.uploadedToStorage = true;
            }
            logger.log('Sending EndRun request');
            // check the return value
            try {
                const res = yield api.endRun(data.runEnd.runData, data.runEnd.taskExecutions, data.ciExecutionContext, data.runEnd.linkId);
                if (!res) {
                    throw new Error(reporter.apiError);
                }
                logger.log('Done sending EndRun request');
            }
            catch (e) {
                logger.log('Error when sending EndRun');
                console.log(e);
            }
            yield (0, metric_logger_1.submitRunMetrics)(data.runOptions);
        }), 0);
        return '{}';
    });
}
exports.default = processRunEnd;
//# sourceMappingURL=process-run-end.js.map