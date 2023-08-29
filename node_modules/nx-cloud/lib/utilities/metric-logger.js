"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitRunMetrics = exports.RUNNER_FAILURE_PERF_ENTRY = exports.mapRespToPerfEntry = exports.createMetricRecorder = void 0;
const perf_hooks_1 = require("perf_hooks");
const axios_1 = require("./axios");
const environment_1 = require("./environment");
const print_message_1 = require("./print-message");
const performanceEntries = [];
const createMetricRecorder = (entryType) => {
    const startTime = perf_hooks_1.performance.now();
    const recorder = {
        recordMetric: (metadata) => {
            const endTime = perf_hooks_1.performance.now();
            metadata.durationMs = endTime - startTime;
            metadata.entryType = entryType;
            performanceEntries.push(metadata);
        },
    };
    return recorder;
};
exports.createMetricRecorder = createMetricRecorder;
/**
 * Handles creating metadata for metrics that only need an NxCloudPerfEntry
 * @param resp response from nx-api
 */
const mapRespToPerfEntry = (resp) => {
    var _a, _b, _c;
    return ({
        success: (_b = (_a = resp === null || resp === void 0 ? void 0 : resp.status) === null || _a === void 0 ? void 0 : _a.toString().startsWith('2')) !== null && _b !== void 0 ? _b : false,
        statusCode: (_c = resp === null || resp === void 0 ? void 0 : resp.status) !== null && _c !== void 0 ? _c : -1,
    });
};
exports.mapRespToPerfEntry = mapRespToPerfEntry;
/**
 * Constant to represent metrics when something goes wrong on the runner side
 */
exports.RUNNER_FAILURE_PERF_ENTRY = {
    success: false,
    statusCode: -1,
};
const CI_SAMPLE_RATE = 0.1; // Record metrics for 1/10 CI runs
const NON_CI_SAMPLE_RATE = 0.01; // Record metrics for 1/100 non-CI runs
const submitRunMetrics = (options) => {
    let sampleRate;
    if ((0, environment_1.getBranch)()) {
        sampleRate = CI_SAMPLE_RATE;
    }
    else {
        sampleRate = NON_CI_SAMPLE_RATE;
    }
    try {
        if (environment_1.NX_CLOUD_FORCE_METRICS || Math.random() < sampleRate) {
            if (environment_1.VERBOSE_LOGGING) {
                (0, print_message_1.printMessage)('Submitting runner metrics for this run.');
            }
            const axiosInstance = (0, axios_1.createApiAxiosInstance)(options);
            return axiosInstance
                .post('/nx-cloud/save-metrics', {
                entries: performanceEntries,
            })
                .catch((e) => { });
        }
        else {
            return Promise.resolve();
        }
    }
    catch (e) { }
};
exports.submitRunMetrics = submitRunMetrics;
//# sourceMappingURL=metric-logger.js.map