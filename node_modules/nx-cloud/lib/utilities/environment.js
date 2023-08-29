"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCommand = exports.getMachineInfo = exports.getBranch = exports.getRunGroup = exports.getCIExecutionEnv = exports.getCIExecutionId = exports.extractGitRef = exports.extractGitSha = exports.nxInvokedByRunner = exports.agentRunningInDistributedExecution = exports.NX_CLOUD_NO_TIMEOUTS = exports.VERBOSE_LOGGING = exports.ENCRYPTION_KEY = exports.ACCESS_TOKEN = exports.NX_NO_CLOUD = exports.NUMBER_OF_AXIOS_RETRIES = exports.NX_CLOUD_FORCE_METRICS = exports.NX_CLOUD_DISTRIBUTED_EXECUTION_STOP_AGENTS_ON_FAILURE = exports.NX_CLOUD_DISTRIBUTED_EXECUTION_AGENT_COUNT = exports.DISTRIBUTED_TASK_EXECUTION_INTERNAL_ERROR_STATUS_CODE = exports.DEFAULT_FILE_SIZE_LIMIT = exports.NX_CLOUD_UNLIMITED_OUTPUT = exports.UNLIMITED_FILE_SIZE = exports.NO_COMPLETED_TASKS_TIMEOUT = exports.NO_MESSAGES_TIMEOUT = exports.UNLIMITED_TIMEOUT = void 0;
const child_process_1 = require("child_process");
const dotenv = require("dotenv");
const fs_1 = require("fs");
const path_1 = require("path");
const is_ci_1 = require("./is-ci");
const is_private_cloud_1 = require("./is-private-cloud");
const { workspaceRoot } = require('./nx-imports');
// Set once
exports.UNLIMITED_TIMEOUT = 9999999;
exports.NO_MESSAGES_TIMEOUT = process.env.NX_CLOUD_AGENT_TIMEOUT_MS
    ? Number(process.env.NX_CLOUD_AGENT_TIMEOUT_MS)
    : 3600000; // 60 minutes
exports.NO_COMPLETED_TASKS_TIMEOUT = process.env
    .NX_CLOUD_ORCHESTRATOR_TIMEOUT_MS
    ? Number(process.env.NX_CLOUD_ORCHESTRATOR_TIMEOUT_MS)
    : 3600000; // 60 minutes
exports.UNLIMITED_FILE_SIZE = 1000 * 1000 * 10000;
exports.NX_CLOUD_UNLIMITED_OUTPUT = process.env.NX_CLOUD_UNLIMITED_OUTPUT === 'true';
exports.DEFAULT_FILE_SIZE_LIMIT = 1000 * 1000 * 300;
exports.DISTRIBUTED_TASK_EXECUTION_INTERNAL_ERROR_STATUS_CODE = 166;
exports.NX_CLOUD_DISTRIBUTED_EXECUTION_AGENT_COUNT = process.env
    .NX_CLOUD_DISTRIBUTED_EXECUTION_AGENT_COUNT
    ? Number(process.env.NX_CLOUD_DISTRIBUTED_EXECUTION_AGENT_COUNT)
    : null;
exports.NX_CLOUD_DISTRIBUTED_EXECUTION_STOP_AGENTS_ON_FAILURE = process.env.NX_CLOUD_DISTRIBUTED_EXECUTION_STOP_AGENTS_ON_FAILURE != 'false';
exports.NX_CLOUD_FORCE_METRICS = process.env.NX_CLOUD_FORCE_METRICS === 'true';
exports.NUMBER_OF_AXIOS_RETRIES = process.env.NX_CLOUD_NUMBER_OF_RETRIES
    ? Number(process.env.NX_CLOUD_NUMBER_OF_RETRIES)
    : (0, is_ci_1.isCI)()
        ? 10
        : 1;
exports.NX_NO_CLOUD = process.env.NX_NO_CLOUD === 'true';
loadEnvVars();
function agentRunningInDistributedExecution(distributedExecutionId) {
    return !!distributedExecutionId;
}
exports.agentRunningInDistributedExecution = agentRunningInDistributedExecution;
function nxInvokedByRunner() {
    return (process.env.NX_INVOKED_BY_RUNNER === 'true' ||
        process.env.NX_CLOUD === 'false');
}
exports.nxInvokedByRunner = nxInvokedByRunner;
function extractGitSha() {
    try {
        return (0, child_process_1.execSync)(`git rev-parse HEAD`, { stdio: 'pipe' }).toString().trim();
    }
    catch (e) {
        return undefined;
    }
}
exports.extractGitSha = extractGitSha;
function extractGitRef() {
    try {
        return (0, child_process_1.execSync)(`git rev-parse --symbolic-full-name HEAD`, {
            stdio: 'pipe',
        })
            .toString()
            .trim();
    }
    catch (e) {
        return undefined;
    }
}
exports.extractGitRef = extractGitRef;
function parseEnv() {
    try {
        const envContents = (0, fs_1.readFileSync)((0, path_1.join)(workspaceRoot, 'nx-cloud.env'));
        return dotenv.parse(envContents);
    }
    catch (e) {
        return {};
    }
}
function loadEnvVars() {
    const parsed = parseEnv();
    exports.ACCESS_TOKEN =
        process.env.NX_CLOUD_AUTH_TOKEN ||
            process.env.NX_CLOUD_ACCESS_TOKEN ||
            parsed.NX_CLOUD_AUTH_TOKEN ||
            parsed.NX_CLOUD_ACCESS_TOKEN;
    exports.ENCRYPTION_KEY =
        process.env.NX_CLOUD_ENCRYPTION_KEY || parsed.NX_CLOUD_ENCRYPTION_KEY;
    exports.VERBOSE_LOGGING =
        process.env.NX_VERBOSE_LOGGING === 'true' ||
            parsed.NX_VERBOSE_LOGGING === 'true';
    exports.NX_CLOUD_NO_TIMEOUTS =
        process.env.NX_CLOUD_NO_TIMEOUTS === 'true' ||
            parsed.NX_CLOUD_NO_TIMEOUTS === 'true';
}
function getCIExecutionId() {
    if ((0, is_private_cloud_1.isConnectedToPrivateCloud)())
        return undefined;
    return _ciExecutionId();
}
exports.getCIExecutionId = getCIExecutionId;
function _ciExecutionId() {
    if (process.env.NX_CI_EXECUTION_ID !== undefined) {
        return process.env.NX_CI_EXECUTION_ID;
    }
    // for backwards compat
    if (process.env.NX_RUN_GROUP !== undefined) {
        return process.env.NX_RUN_GROUP;
    }
    if (process.env.CIRCLECI !== undefined && process.env.CIRCLE_WORKFLOW_ID) {
        return process.env.CIRCLE_WORKFLOW_ID;
    }
    if (process.env.TRAVIS_BUILD_ID !== undefined) {
        return process.env.TRAVIS_BUILD_ID;
    }
    if (process.env.GITHUB_ACTIONS && process.env.GITHUB_RUN_ID) {
        return `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`;
    }
    if (process.env.BUILD_BUILDID) {
        return process.env.BUILD_BUILDID;
    }
    if (process.env.BITBUCKET_BUILD_NUMBER !== undefined) {
        return process.env.BITBUCKET_BUILD_NUMBER;
    }
    if (process.env.VERCEL_GIT_COMMIT_SHA !== undefined) {
        return process.env.VERCEL_GIT_COMMIT_SHA;
    }
    if (process.env.CI_PIPELINE_ID) {
        return process.env.CI_PIPELINE_ID;
    }
    // Jenkins
    if (process.env.BUILD_TAG) {
        return process.env.BUILD_TAG;
    }
    return null;
}
function getCIExecutionEnv() {
    var _a;
    if ((0, is_private_cloud_1.isConnectedToPrivateCloud)())
        return undefined;
    return (_a = process.env.NX_CI_EXECUTION_ENV) !== null && _a !== void 0 ? _a : '';
}
exports.getCIExecutionEnv = getCIExecutionEnv;
function getRunGroup() {
    if (process.env.NX_RUN_GROUP !== undefined) {
        return process.env.NX_RUN_GROUP;
    }
    const ciExecutionId = _ciExecutionId();
    if (ciExecutionId) {
        if (getCIExecutionEnv()) {
            return `${ciExecutionId}-${getCIExecutionEnv()}`;
        }
        else {
            return ciExecutionId;
        }
    }
    return extractGitSha();
}
exports.getRunGroup = getRunGroup;
function getBranch() {
    var _a;
    if (process.env.NX_BRANCH !== undefined) {
        return process.env.NX_BRANCH;
    }
    if (process.env.CIRCLECI !== undefined) {
        if (process.env.CIRCLE_PR_NUMBER !== undefined) {
            return process.env.CIRCLE_PR_NUMBER;
        }
        else if (process.env.CIRCLE_PULL_REQUEST !== undefined) {
            const p = process.env.CIRCLE_PULL_REQUEST.split('/');
            return p[p.length - 1];
        }
        else if (process.env.CIRCLE_BRANCH !== undefined) {
            return process.env.CIRCLE_BRANCH;
        }
    }
    if (process.env.TRAVIS_PULL_REQUEST !== undefined) {
        return process.env.TRAVIS_PULL_REQUEST;
    }
    // refs/pull/78/merge
    if (process.env.GITHUB_ACTIONS) {
        if (process.env.GITHUB_REF) {
            const ref = process.env.GITHUB_REF.match(/refs\/pull\/(\d+)\/merge/);
            if (ref) {
                return ref[1];
            }
        }
        return (_a = process.env.GITHUB_HEAD_REF) !== null && _a !== void 0 ? _a : '';
    }
    if (process.env.BITBUCKET_PR_ID !== undefined) {
        return process.env.BITBUCKET_PR_ID;
    }
    if (process.env.VERCEL_GIT_COMMIT_REF !== undefined) {
        return process.env.VERCEL_GIT_COMMIT_REF;
    }
    // Gitlab, merge request flow only
    // For support: Users must have their pipeline configured as merge requests
    // ONLY to have this variable appear.
    // https://docs.gitlab.com/ee/ci/pipelines/merge_request_pipelines.html#use-only-to-add-jobs
    if (process.env.CI_MERGE_REQUEST_IID) {
        return process.env.CI_MERGE_REQUEST_IID;
    }
    // Gitlab, branch pipeline flow only
    // Will not work with bot comments
    if (process.env.CI_COMMIT_BRANCH) {
        return process.env.CI_COMMIT_BRANCH;
    }
    // Jenkins, this will only be populated in MULTIBRANCH pipelines.
    // Remember that if someone asks in support :)
    if (process.env.GIT_BRANCH) {
        return process.env.GIT_BRANCH;
    }
    return null;
}
exports.getBranch = getBranch;
function getMachineInfo(options) {
    const os = require('os');
    return {
        machineId: '',
        platform: os.platform(),
        version: os.version ? os.version() : '',
        cpuCores: os.cpus().length,
    };
}
exports.getMachineInfo = getMachineInfo;
function parseCommand() {
    var _a, _b;
    const env = (_b = (_a = process.env.NX_CI_EXECUTION_ENV) !== null && _a !== void 0 ? _a : process.env.NX_CLOUD_ENV_NAME) !== null && _b !== void 0 ? _b : undefined;
    const cmdBase = (0, path_1.parse)(process.argv[1]).name;
    const args = `${process.argv.slice(2).join(' ')}`;
    const res = `${cmdBase} ${args}`;
    return env ? `${env} ${res}` : res;
}
exports.parseCommand = parseCommand;
//# sourceMappingURL=environment.js.map