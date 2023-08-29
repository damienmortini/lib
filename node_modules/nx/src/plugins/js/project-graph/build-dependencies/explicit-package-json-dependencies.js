"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExplicitPackageJsonDependencies = void 0;
const file_utils_1 = require("../../../../project-graph/file-utils");
const path_1 = require("path");
const project_graph_1 = require("../../../../config/project-graph");
const json_1 = require("../../../../utils/json");
const path_2 = require("../../../../utils/path");
function buildExplicitPackageJsonDependencies(nxJsonConfiguration, projectsConfigurations, graph, filesToProcess) {
    const res = [];
    let packageNameMap = undefined;
    const nodes = Object.values(graph.nodes);
    Object.keys(filesToProcess).forEach((source) => {
        Object.values(filesToProcess[source]).forEach((f) => {
            if (isPackageJsonAtProjectRoot(nodes, f.file)) {
                // we only create the package name map once and only if a package.json file changes
                packageNameMap =
                    packageNameMap ||
                        createPackageNameMap(nxJsonConfiguration, projectsConfigurations);
                processPackageJson(source, f.file, graph, res, packageNameMap);
            }
        });
    });
    return res;
}
exports.buildExplicitPackageJsonDependencies = buildExplicitPackageJsonDependencies;
function createPackageNameMap(nxJsonConfiguration, projectsConfigurations) {
    var _a;
    const res = {};
    for (let projectName of Object.keys(projectsConfigurations.projects)) {
        try {
            const packageJson = (0, json_1.parseJson)((0, file_utils_1.defaultFileRead)((0, path_1.join)(projectsConfigurations.projects[projectName].root, 'package.json')));
            // TODO(v17): Stop reading nx.json for the npmScope
            const npmScope = nxJsonConfiguration.npmScope;
            res[(_a = packageJson.name) !== null && _a !== void 0 ? _a : (npmScope
                ? `${npmScope === '@' ? '' : '@'}${npmScope}/${projectName}`
                : projectName)] = projectName;
        }
        catch (e) { }
    }
    return res;
}
function isPackageJsonAtProjectRoot(nodes, fileName) {
    return (fileName.endsWith('package.json') &&
        nodes.find((projectNode) => (projectNode.type === 'lib' || projectNode.type === 'app') &&
            (0, path_2.joinPathFragments)(projectNode.data.root, 'package.json') === fileName));
}
function processPackageJson(sourceProject, fileName, graph, collectedDeps, packageNameMap) {
    try {
        const deps = readDeps((0, json_1.parseJson)((0, file_utils_1.defaultFileRead)(fileName)));
        // the name matches the import path
        deps.forEach((d) => {
            // package.json refers to another project in the monorepo
            if (packageNameMap[d]) {
                collectedDeps.push({
                    sourceProjectName: sourceProject,
                    targetProjectName: packageNameMap[d],
                    sourceProjectFile: fileName,
                    type: project_graph_1.DependencyType.static,
                });
            }
            else if (graph.externalNodes[`npm:${d}`]) {
                collectedDeps.push({
                    sourceProjectName: sourceProject,
                    targetProjectName: `npm:${d}`,
                    sourceProjectFile: fileName,
                    type: project_graph_1.DependencyType.static,
                });
            }
        });
    }
    catch (e) {
        if (process.env.NX_VERBOSE_LOGGING === 'true') {
            console.log(e);
        }
    }
}
function readDeps(packageJson) {
    var _a, _b, _c, _d;
    return [
        ...Object.keys((_a = packageJson === null || packageJson === void 0 ? void 0 : packageJson.dependencies) !== null && _a !== void 0 ? _a : {}),
        ...Object.keys((_b = packageJson === null || packageJson === void 0 ? void 0 : packageJson.devDependencies) !== null && _b !== void 0 ? _b : {}),
        ...Object.keys((_c = packageJson === null || packageJson === void 0 ? void 0 : packageJson.peerDependencies) !== null && _c !== void 0 ? _c : {}),
        ...Object.keys((_d = packageJson === null || packageJson === void 0 ? void 0 : packageJson.optionalDependencies) !== null && _d !== void 0 ? _d : {}),
    ];
}
