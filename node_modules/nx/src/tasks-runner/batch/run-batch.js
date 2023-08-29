"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const batch_messages_1 = require("./batch-messages");
const workspaces_1 = require("../../config/workspaces");
const workspace_root_1 = require("../../utils/workspace-root");
const params_1 = require("../../utils/params");
const project_graph_1 = require("../../project-graph/project-graph");
const configuration_1 = require("../../config/configuration");
const async_iterator_1 = require("../../utils/async-iterator");
function getBatchExecutor(executorName) {
    const workspace = new workspaces_1.Workspaces(workspace_root_1.workspaceRoot);
    const [nodeModule, exportName] = executorName.split(':');
    return workspace.readExecutor(nodeModule, exportName);
}
function runTasks(executorName, batchTaskGraph, fullTaskGraph) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const input = {};
        const projectGraph = yield (0, project_graph_1.createProjectGraphAsync)();
        const projectsConfigurations = (0, project_graph_1.readProjectsConfigurationFromProjectGraph)(projectGraph);
        const nxJsonConfiguration = (0, configuration_1.readNxJson)();
        const batchExecutor = getBatchExecutor(executorName);
        const tasks = Object.values(batchTaskGraph.tasks);
        const context = {
            root: workspace_root_1.workspaceRoot,
            cwd: process.cwd(),
            projectsConfigurations,
            nxJsonConfiguration,
            workspace: Object.assign(Object.assign({}, projectsConfigurations), nxJsonConfiguration),
            isVerbose: false,
            projectGraph,
            taskGraph: fullTaskGraph,
        };
        for (const task of tasks) {
            const projectConfiguration = projectsConfigurations.projects[task.target.project];
            const targetConfiguration = projectConfiguration.targets[task.target.target];
            input[task.id] = (0, params_1.combineOptionsForExecutor)(task.overrides, task.target.configuration, targetConfiguration, batchExecutor.schema, null, process.cwd());
        }
        try {
            const results = yield batchExecutor.batchImplementationFactory()(batchTaskGraph, input, tasks[0].overrides, context);
            if (typeof results !== 'object') {
                throw new Error(`"${executorName} returned invalid results: ${results}`);
            }
            if ((0, async_iterator_1.isAsyncIterator)(results)) {
                const batchResults = {};
                do {
                    const current = yield results.next();
                    if (!current.done) {
                        batchResults[current.value.task] = current.value.result;
                        process.send({
                            type: batch_messages_1.BatchMessageType.CompleteTask,
                            task: current.value.task,
                            result: current.value.result,
                        });
                    }
                    else {
                        break;
                    }
                } while (true);
                return batchResults;
            }
            return results;
        }
        catch (e) {
            const isVerbose = tasks[0].overrides.verbose;
            console.error(isVerbose ? e : e.message);
            process.exit(1);
        }
    });
}
process.on('message', (message) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    switch (message.type) {
        case batch_messages_1.BatchMessageType.RunTasks: {
            const results = yield runTasks(message.executorName, message.batchTaskGraph, message.fullTaskGraph);
            process.send({
                type: batch_messages_1.BatchMessageType.CompleteBatchExecution,
                results,
            });
        }
    }
}));
