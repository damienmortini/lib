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
exports.generator = void 0;
const fs_1 = require("fs");
const print_cloud_connection_disabled_message_1 = require("../../utilities/print-cloud-connection-disabled-message");
function updateNxJson(json, token) {
    var _a, _b, _c;
    const alreadySetOptions = (_c = (_b = (_a = json.tasksRunnerOptions) === null || _a === void 0 ? void 0 : _a.default) === null || _b === void 0 ? void 0 : _b.options) !== null && _c !== void 0 ? _c : {};
    const options = Object.assign(Object.assign({}, alreadySetOptions), { accessToken: token });
    if (process.env.NX_CLOUD_API) {
        options.url = process.env.NX_CLOUD_API;
    }
    json.tasksRunnerOptions = {
        default: {
            runner: isNxVersion16OrHigher() ? 'nx-cloud' : '@nrwl/nx-cloud',
            options,
        },
    };
}
function readNxJsonUsingNx(host) {
    try {
        const jsonUtils = require('nx/src/utils/json');
        return jsonUtils.parseJson(host.read('nx.json', 'utf-8'));
    }
    catch (ee) {
        return JSON.parse(host.read('nx.json', 'utf-8'));
    }
}
function writeNxJsonUsingNx(host, json, token) {
    updateNxJson(json, token);
    try {
        const jsonUtils = require('nx/src/utils/json');
        host.write('nx.json', jsonUtils.serializeJson(json));
    }
    catch (ee) {
        host.write('nx.json', JSON.stringify(json, null, 2));
    }
}
function getRootPackageName() {
    var _a;
    let packageJson;
    try {
        packageJson = JSON.parse((0, fs_1.readFileSync)('package.json').toString());
    }
    catch (e) { }
    return (_a = packageJson === null || packageJson === void 0 ? void 0 : packageJson.name) !== null && _a !== void 0 ? _a : 'my-workspace';
}
function isNxVersion16OrHigher() {
    try {
        const packageJson = JSON.parse((0, fs_1.readFileSync)('package.json').toString());
        const deps = Object.assign(Object.assign({}, (packageJson.dependencies || {})), (packageJson.devDependencies || {}));
        if (deps['nx'].startsWith('15.') ||
            deps['nx'].startsWith('14.') ||
            deps['nx'].startsWith('13.') ||
            deps['nx'].startsWith('12.')) {
            return false;
        }
        else {
            return true;
        }
    }
    catch (e) {
        return true;
    }
}
function removeTrailingSlash(apiUrl) {
    return apiUrl[apiUrl.length - 1] === '/'
        ? apiUrl.substr(0, apiUrl.length - 1)
        : apiUrl;
}
function createNxCloudWorkspace(workspaceName, installationSource) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiUrl = removeTrailingSlash(process.env.NX_CLOUD_API || process.env.NRWL_API || `https://cloud.nx.app`);
        const response = yield require('axios').post(`${apiUrl}/nx-cloud/create-org-and-workspace`, {
            workspaceName,
            installationSource,
        });
        if (response.data.message) {
            throw new Error(response.data.message);
        }
        return response.data;
    });
}
function printSuccessMessage(url) {
    const { output } = require('../../utilities/nx-imports');
    let host = 'nx.app';
    try {
        host = new (require('url').URL)(url).host;
    }
    catch (e) { }
    output.note({
        title: `Distributed caching via Nx Cloud has been enabled`,
        bodyLines: [
            `In addition to the caching, Nx Cloud provides config-free distributed execution,`,
            `UI for viewing complex runs and GitHub integration. Learn more at https://nx.app`,
            ``,
            `Your workspace is currently unclaimed. Run details from unclaimed workspaces can be viewed on ${host} by anyone`,
            `with the link. Claim your workspace at the following link to restrict access.`,
            ``,
            `${url}`,
        ],
    });
}
function generator(host, schema) {
    return __awaiter(this, void 0, void 0, function* () {
        const nxJson = readNxJsonUsingNx(host);
        if (nxJson.neverConnectToCloud) {
            return () => {
                (0, print_cloud_connection_disabled_message_1.printCloudConnectionDisabledMessage)();
            };
        }
        else {
            const r = yield createNxCloudWorkspace(getRootPackageName(), schema.installationSource);
            writeNxJsonUsingNx(host, nxJson, r.token);
            return () => printSuccessMessage(r.url);
        }
    });
}
exports.generator = generator;
//# sourceMappingURL=init.js.map