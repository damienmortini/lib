"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProjectGraphUsingProjectFileMap = exports.getProjectFileMap = void 0;
const tslib_1 = require("tslib");
const workspace_root_1 = require("../utils/workspace-root");
const path_1 = require("path");
const perf_hooks_1 = require("perf_hooks");
const assert_workspace_validity_1 = require("../utils/assert-workspace-validity");
const nx_deps_cache_1 = require("./nx-deps-cache");
const build_dependencies_1 = require("./build-dependencies");
const build_nodes_1 = require("./build-nodes");
const nx_plugin_1 = require("../utils/nx-plugin");
const typescript_1 = require("../plugins/js/utils/typescript");
const fileutils_1 = require("../utils/fileutils");
const project_graph_builder_1 = require("./project-graph-builder");
const configuration_1 = require("../config/configuration");
const fs_1 = require("fs");
let storedProjectFileMap = null;
let storedAllWorkspaceFiles = null;
function getProjectFileMap() {
    if (!!storedProjectFileMap) {
        return {
            projectFileMap: storedProjectFileMap,
            allWorkspaceFiles: storedAllWorkspaceFiles,
        };
    }
    else {
        return { projectFileMap: {}, allWorkspaceFiles: [] };
    }
}
exports.getProjectFileMap = getProjectFileMap;
function buildProjectGraphUsingProjectFileMap(projectsConfigurations, projectFileMap, allWorkspaceFiles, fileMap, shouldWriteCache) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        storedProjectFileMap = projectFileMap;
        storedAllWorkspaceFiles = allWorkspaceFiles;
        const nxJson = (0, configuration_1.readNxJson)();
        const projectGraphVersion = '6.0';
        (0, assert_workspace_validity_1.assertWorkspaceValidity)(projectsConfigurations, nxJson);
        const packageJsonDeps = readCombinedDeps();
        const rootTsConfig = readRootTsConfig();
        let filesToProcess;
        let cachedFileData;
        const useCacheData = fileMap &&
            !(0, nx_deps_cache_1.shouldRecomputeWholeGraph)(fileMap, packageJsonDeps, projectsConfigurations, nxJson, rootTsConfig);
        if (useCacheData) {
            const fromCache = (0, nx_deps_cache_1.extractCachedFileData)(projectFileMap, fileMap);
            filesToProcess = fromCache.filesToProcess;
            cachedFileData = fromCache.cachedFileData;
        }
        else {
            filesToProcess = projectFileMap;
            cachedFileData = {};
        }
        const context = createContext(projectsConfigurations, nxJson, projectFileMap, filesToProcess);
        let projectGraph = yield buildProjectGraphUsingContext(nxJson, context, cachedFileData, projectGraphVersion);
        const projectFileMapCache = (0, nx_deps_cache_1.createProjectFileMapCache)(nxJson, packageJsonDeps, projectFileMap, rootTsConfig);
        if (shouldWriteCache) {
            (0, nx_deps_cache_1.writeCache)(projectFileMapCache, projectGraph);
        }
        return {
            projectGraph,
            projectFileMapCache,
        };
    });
}
exports.buildProjectGraphUsingProjectFileMap = buildProjectGraphUsingProjectFileMap;
function readCombinedDeps() {
    const installationPackageJsonPath = (0, path_1.join)(workspace_root_1.workspaceRoot, '.nx', 'installation', 'package.json');
    const installationPackageJson = (0, fs_1.existsSync)(installationPackageJsonPath)
        ? (0, fileutils_1.readJsonFile)(installationPackageJsonPath)
        : {};
    const rootPackageJsonPath = (0, path_1.join)(workspace_root_1.workspaceRoot, 'package.json');
    const rootPackageJson = (0, fs_1.existsSync)(rootPackageJsonPath)
        ? (0, fileutils_1.readJsonFile)(rootPackageJsonPath)
        : {};
    return Object.assign(Object.assign(Object.assign(Object.assign({}, rootPackageJson.dependencies), rootPackageJson.devDependencies), installationPackageJson.dependencies), installationPackageJson.devDependencies);
}
function buildProjectGraphUsingContext(nxJson, ctx, cachedFileData, projectGraphVersion) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        perf_hooks_1.performance.mark('build project graph:start');
        const builder = new project_graph_builder_1.ProjectGraphBuilder(null, ctx.fileMap);
        builder.setVersion(projectGraphVersion);
        yield (0, build_nodes_1.buildWorkspaceProjectNodes)(ctx, builder, nxJson);
        const initProjectGraph = builder.getUpdatedProjectGraph();
        const r = yield updateProjectGraphWithPlugins(ctx, initProjectGraph);
        const updatedBuilder = new project_graph_builder_1.ProjectGraphBuilder(r, ctx.fileMap);
        for (const proj of Object.keys(cachedFileData)) {
            for (const f of ctx.fileMap[proj] || []) {
                const cached = cachedFileData[proj][f.file];
                if (cached && cached.deps) {
                    f.deps = [...cached.deps];
                }
            }
        }
        (0, build_dependencies_1.buildImplicitProjectDependencies)(ctx, updatedBuilder);
        const finalGraph = updatedBuilder.getUpdatedProjectGraph();
        perf_hooks_1.performance.mark('build project graph:end');
        perf_hooks_1.performance.measure('build project graph', 'build project graph:start', 'build project graph:end');
        return finalGraph;
    });
}
function createContext(projectsConfigurations, nxJson, fileMap, filesToProcess) {
    const projects = Object.keys(projectsConfigurations.projects).reduce((map, projectName) => {
        map[projectName] = Object.assign({}, projectsConfigurations.projects[projectName]);
        return map;
    }, {});
    return {
        nxJsonConfiguration: nxJson,
        projectsConfigurations,
        workspace: Object.assign(Object.assign(Object.assign({}, projectsConfigurations), nxJson), { projects }),
        fileMap,
        filesToProcess,
    };
}
function updateProjectGraphWithPlugins(context, initProjectGraph) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const plugins = (yield (0, nx_plugin_1.loadNxPlugins)(context.nxJsonConfiguration.plugins)).filter((x) => !!x.processProjectGraph);
        let graph = initProjectGraph;
        for (const plugin of plugins) {
            try {
                graph = yield plugin.processProjectGraph(graph, context);
            }
            catch (e) {
                let message = `Failed to process the project graph with "${plugin.name}".`;
                if (e instanceof Error) {
                    e.message = message + '\n' + e.message;
                    throw e;
                }
                throw new Error(message);
            }
        }
        return graph;
    });
}
function readRootTsConfig() {
    try {
        const tsConfigPath = (0, typescript_1.getRootTsConfigPath)();
        if (tsConfigPath) {
            return (0, fileutils_1.readJsonFile)(tsConfigPath, { expectComments: true });
        }
    }
    catch (e) {
        return {};
    }
}
