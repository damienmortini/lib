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
exports.axiosMultipleTries = exports.printDuration = exports.createApiAxiosInstance = exports.AxiosException = void 0;
const environment_1 = require("./environment");
const waiter_1 = require("./waiter");
const path_1 = require("path");
const { output } = require('./nx-imports');
const axios = require('axios');
class AxiosException {
    constructor(type, message, axiosException) {
        this.type = type;
        this.message = message;
        this.axiosException = axiosException;
    }
}
exports.AxiosException = AxiosException;
function createApiAxiosInstance(options) {
    let axiosConfigBuilder = (axiosConfig) => axiosConfig;
    const baseUrl = process.env.NX_CLOUD_API || options.url || 'https://cloud.nx.app';
    const accessToken = environment_1.ACCESS_TOKEN ? environment_1.ACCESS_TOKEN : options.accessToken;
    if (!accessToken) {
        throw new Error(`Unable to authenticate. Either define accessToken in nx.json or set the NX_CLOUD_ACCESS_TOKEN env variable.`);
    }
    if (options.customProxyConfigPath) {
        const { nxCloudProxyConfig } = require((0, path_1.join)(process.cwd(), options.customProxyConfigPath));
        axiosConfigBuilder = nxCloudProxyConfig !== null && nxCloudProxyConfig !== void 0 ? nxCloudProxyConfig : axiosConfigBuilder;
    }
    return axios.create(axiosConfigBuilder({
        baseURL: baseUrl,
        timeout: environment_1.NX_CLOUD_NO_TIMEOUTS ? environment_1.UNLIMITED_TIMEOUT : 10000,
        headers: { authorization: accessToken },
    }));
}
exports.createApiAxiosInstance = createApiAxiosInstance;
function printDuration(description, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const b = new Date();
        const res = yield callback();
        const a = new Date();
        if (environment_1.VERBOSE_LOGGING) {
            console.log(`${description}: ${a.getTime() - b.getTime()}`);
        }
        return res;
    });
}
exports.printDuration = printDuration;
function axiosMultipleTries(axiosCallCreator, retriesLeft = environment_1.NUMBER_OF_AXIOS_RETRIES) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield axiosCallCreator();
        }
        catch (e) {
            const code = e.code || (e.response && e.response.status);
            // Do not retry if we receive an unauthorized or forbidden response
            if (code === 401 || code === 403) {
                retriesLeft = 0;
            }
            if (retriesLeft === 0) {
                let message = e.response
                    ? e.response.data.message
                        ? e.response.data.message
                        : e.response.data
                    : e.message;
                if (typeof message !== 'string') {
                    message = e.message;
                }
                throw new AxiosException('failure', `Error when connecting to Nx Cloud. Code: ${code}. Error: ${message}.`, e);
            }
            else {
                const retryAfter = 1000 +
                    (environment_1.NUMBER_OF_AXIOS_RETRIES + 1 - retriesLeft) * 4000 * Math.random();
                if (environment_1.VERBOSE_LOGGING) {
                    output.note({
                        title: `Received ${code}. Retrying in ${retryAfter}ms.`,
                    });
                }
                yield (0, waiter_1.wait)(retryAfter);
                return axiosMultipleTries(axiosCallCreator, retriesLeft - 1);
            }
        }
    });
}
exports.axiosMultipleTries = axiosMultipleTries;
//# sourceMappingURL=axios.js.map