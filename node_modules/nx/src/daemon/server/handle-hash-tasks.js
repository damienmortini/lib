"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleHashTasks = void 0;
const tslib_1 = require("tslib");
const project_graph_incremental_recomputation_1 = require("./project-graph-incremental-recomputation");
const task_hasher_1 = require("../../hasher/task-hasher");
const configuration_1 = require("../../config/configuration");
const file_hasher_1 = require("../../hasher/file-hasher");
const set_hash_env_1 = require("../../hasher/set-hash-env");
/**
 * We use this not to recreated hasher for every hash operation
 * TaskHasher has a cache inside, so keeping it around results in faster performance
 */
let storedProjectGraph = null;
let storedTaskGraph = null;
let storedHasher = null;
function handleHashTasks(payload) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        (0, set_hash_env_1.setHashEnv)(payload.env);
        const { projectGraph, allWorkspaceFiles, projectFileMap } = yield (0, project_graph_incremental_recomputation_1.getCachedSerializedProjectGraphPromise)();
        const nxJson = (0, configuration_1.readNxJson)();
        if (projectGraph !== storedProjectGraph) {
            storedProjectGraph = projectGraph;
            storedTaskGraph = payload.taskGraph;
            storedHasher = new task_hasher_1.InProcessTaskHasher(projectFileMap, allWorkspaceFiles, projectGraph, payload.taskGraph, nxJson, payload.runnerOptions, file_hasher_1.fileHasher);
        }
        const response = JSON.stringify(yield storedHasher.hashTasks(payload.tasks));
        return {
            response,
            description: 'handleHashTasks',
        };
    });
}
exports.handleHashTasks = handleHashTasks;
