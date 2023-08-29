"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashTask = exports.hashTasksThatDoNotDependOnOutputsOfOtherTasks = void 0;
const tslib_1 = require("tslib");
const utils_1 = require("../tasks-runner/utils");
const project_graph_1 = require("../project-graph/project-graph");
const task_hasher_1 = require("./task-hasher");
function hashTasksThatDoNotDependOnOutputsOfOtherTasks(workspaces, hasher, projectGraph, taskGraph, nxJson) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const tasks = Object.values(taskGraph.tasks);
        const tasksWithHashers = yield Promise.all(tasks.map((task) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const customHasher = yield (0, utils_1.getCustomHasher)(task, workspaces, workspaces.readNxJson(), projectGraph);
            return { task, customHasher };
        })));
        const tasksToHash = tasksWithHashers
            .filter(({ task, customHasher }) => {
            // If a task has a custom hasher, it might depend on the outputs of other tasks
            if (customHasher) {
                return false;
            }
            return !(taskGraph.dependencies[task.id].length > 0 &&
                (0, task_hasher_1.getInputs)(task, projectGraph, nxJson).depsOutputs.length > 0);
        })
            .map((t) => t.task);
        const hashes = yield hasher.hashTasks(tasksToHash);
        for (let i = 0; i < tasksToHash.length; i++) {
            tasksToHash[i].hash = hashes[i].value;
            tasksToHash[i].hashDetails = hashes[i].details;
        }
    });
}
exports.hashTasksThatDoNotDependOnOutputsOfOtherTasks = hashTasksThatDoNotDependOnOutputsOfOtherTasks;
function hashTask(workspaces, hasher, projectGraph, taskGraph, task) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const customHasher = yield (0, utils_1.getCustomHasher)(task, workspaces, workspaces.readNxJson(), projectGraph);
        const projectsConfigurations = (0, project_graph_1.readProjectsConfigurationFromProjectGraph)(projectGraph);
        const { value, details } = yield (customHasher
            ? customHasher(task, {
                hasher,
                projectGraph,
                taskGraph,
                workspaceConfig: projectsConfigurations,
                projectsConfigurations,
                nxJsonConfiguration: workspaces.readNxJson(),
            })
            : hasher.hashTask(task));
        task.hash = value;
        task.hashDetails = details;
    });
}
exports.hashTask = hashTask;
