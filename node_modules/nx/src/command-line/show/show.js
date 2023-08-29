"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showProjectHandler = exports.showProjectsHandler = void 0;
const tslib_1 = require("tslib");
const affected_project_graph_1 = require("../../project-graph/affected/affected-project-graph");
const file_utils_1 = require("../../project-graph/file-utils");
const command_line_utils_1 = require("../../utils/command-line-utils");
const project_graph_1 = require("../../project-graph/project-graph");
const find_matching_projects_1 = require("../../utils/find-matching-projects");
const all_file_data_1 = require("../../utils/all-file-data");
function showProjectsHandler(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let graph = yield (0, project_graph_1.createProjectGraphAsync)();
        const nxJson = (0, file_utils_1.readNxJson)();
        const { nxArgs } = (0, command_line_utils_1.splitArgsIntoNxArgsAndOverrides)(args, 'affected', {
            printWarnings: false,
        }, nxJson);
        if (args.affected) {
            graph = yield getAffectedGraph(nxArgs, nxJson, graph);
        }
        if (args.projects) {
            graph.nodes = getGraphNodesMatchingPatterns(graph, args.projects);
        }
        if (args.withTarget) {
            graph.nodes = Object.entries(graph.nodes).reduce((acc, [name, node]) => {
                var _a;
                if ((_a = node.data.targets) === null || _a === void 0 ? void 0 : _a[args.withTarget]) {
                    acc[name] = node;
                }
                return acc;
            }, {});
        }
        const selectedProjects = new Set(Object.keys(graph.nodes));
        if (args.exclude) {
            const excludedProjects = (0, find_matching_projects_1.findMatchingProjects)(nxArgs.exclude, graph.nodes);
            for (const excludedProject of excludedProjects) {
                selectedProjects.delete(excludedProject);
            }
        }
        if (args.json) {
            console.log(JSON.stringify(Array.from(selectedProjects), null, 2));
        }
        else {
            for (const project of selectedProjects) {
                console.log(project);
            }
        }
        process.exit(0);
    });
}
exports.showProjectsHandler = showProjectsHandler;
function showProjectHandler(args) {
    var _a, _b;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const graph = yield (0, project_graph_1.createProjectGraphAsync)();
        const node = graph.nodes[args.projectName];
        if (!node) {
            console.log(`Could not find project ${args.projectName}`);
            process.exit(1);
        }
        if (args.json) {
            console.log(JSON.stringify(node.data, null, 2));
        }
        else {
            const chalk = require('chalk');
            const logIfExists = (label, key) => {
                if (node.data[key]) {
                    console.log(`${chalk.bold(label)}: ${node.data[key]}`);
                }
            };
            logIfExists('Name', 'name');
            logIfExists('Root', 'root');
            logIfExists('Source Root', 'sourceRoot');
            logIfExists('Tags', 'tags');
            logIfExists('Implicit Dependencies', 'implicitDependencies');
            const targets = Object.entries((_a = node.data.targets) !== null && _a !== void 0 ? _a : {});
            const maxTargetNameLength = Math.max(...targets.map(([t]) => t.length));
            const maxExecutorNameLength = Math.max(...targets.map(([, t]) => { var _a, _b; return (_b = (_a = t === null || t === void 0 ? void 0 : t.executor) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0; }));
            if (targets.length > 0) {
                console.log(`${chalk.bold('Targets')}: `);
                for (const [target, targetConfig] of targets) {
                    console.log(`- ${chalk.bold((target + ':').padEnd(maxTargetNameLength + 2))} ${((_b = targetConfig === null || targetConfig === void 0 ? void 0 : targetConfig.executor) !== null && _b !== void 0 ? _b : '').padEnd(maxExecutorNameLength + 2)} ${(() => {
                        var _a;
                        const configurations = Object.keys((_a = targetConfig.configurations) !== null && _a !== void 0 ? _a : {});
                        if (configurations.length) {
                            return chalk.dim(configurations.join(', '));
                        }
                        return '';
                    })()}`);
                }
            }
        }
        process.exit(0);
    });
}
exports.showProjectHandler = showProjectHandler;
function getGraphNodesMatchingPatterns(graph, patterns) {
    const nodes = {};
    const matches = (0, find_matching_projects_1.findMatchingProjects)(patterns, graph.nodes);
    for (const match of matches) {
        nodes[match] = graph.nodes[match];
    }
    return nodes;
}
function getAffectedGraph(nxArgs, nxJson, graph) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return (0, affected_project_graph_1.filterAffected)(graph, (0, file_utils_1.calculateFileChanges)((0, command_line_utils_1.parseFiles)(nxArgs).files, yield (0, all_file_data_1.allFileData)(), nxArgs), nxJson);
    });
}
