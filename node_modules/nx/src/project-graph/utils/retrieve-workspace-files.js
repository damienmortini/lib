"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveProjectConfigurations = exports.retrieveWorkspaceFiles = void 0;
const tslib_1 = require("tslib");
const perf_hooks_1 = require("perf_hooks");
const workspaces_1 = require("../../config/workspaces");
const installation_directory_1 = require("../../utils/installation-directory");
const fileutils_1 = require("../../utils/fileutils");
const path_1 = require("path");
const angular_json_1 = require("../../adapter/angular-json");
/**
 * Walks the workspace directory to create the `projectFileMap`, `ProjectConfigurations` and `allWorkspaceFiles`
 * @throws
 * @param workspaceRoot
 * @param nxJson
 */
function retrieveWorkspaceFiles(workspaceRoot, nxJson) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { getWorkspaceFilesNative } = require('../../native');
        perf_hooks_1.performance.mark('native-file-deps:start');
        let globs = yield configurationGlobs(workspaceRoot, nxJson);
        perf_hooks_1.performance.mark('native-file-deps:end');
        perf_hooks_1.performance.measure('native-file-deps', 'native-file-deps:start', 'native-file-deps:end');
        perf_hooks_1.performance.mark('get-workspace-files:start');
        const { projectConfigurations, projectFileMap, globalFiles } = getWorkspaceFilesNative(workspaceRoot, globs, (configs) => {
            const projectConfigurations = createProjectConfigurations(workspaceRoot, nxJson, configs);
            return projectConfigurations.projects;
        });
        perf_hooks_1.performance.mark('get-workspace-files:end');
        perf_hooks_1.performance.measure('get-workspace-files', 'get-workspace-files:start', 'get-workspace-files:end');
        return {
            allWorkspaceFiles: buildAllWorkspaceFiles(projectFileMap, globalFiles),
            projectFileMap,
            projectConfigurations: {
                version: 2,
                projects: projectConfigurations,
            },
        };
    });
}
exports.retrieveWorkspaceFiles = retrieveWorkspaceFiles;
/**
 * Walk through the workspace and return `ProjectConfigurations`. Only use this if the projectFileMap is not needed.
 *
 * @param workspaceRoot
 * @param nxJson
 */
function retrieveProjectConfigurations(workspaceRoot, nxJson) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { getProjectConfigurations } = require('../../native');
        const globs = yield configurationGlobs(workspaceRoot, nxJson);
        return getProjectConfigurations(workspaceRoot, globs, (configs) => {
            const projectConfigurations = createProjectConfigurations(workspaceRoot, nxJson, configs);
            return projectConfigurations.projects;
        });
    });
}
exports.retrieveProjectConfigurations = retrieveProjectConfigurations;
function buildAllWorkspaceFiles(projectFileMap, globalFiles) {
    perf_hooks_1.performance.mark('get-all-workspace-files:start');
    let fileData = Object.values(projectFileMap).flat();
    fileData = fileData.concat(globalFiles);
    perf_hooks_1.performance.mark('get-all-workspace-files:end');
    perf_hooks_1.performance.measure('get-all-workspace-files', 'get-all-workspace-files:start', 'get-all-workspace-files:end');
    return fileData;
}
function createProjectConfigurations(workspaceRoot, nxJson, configFiles) {
    perf_hooks_1.performance.mark('build-project-configs:start');
    let projectConfigurations = mergeTargetDefaultsIntoProjectDescriptions((0, workspaces_1.buildProjectsConfigurationsFromProjectPaths)(nxJson, configFiles, (path) => (0, fileutils_1.readJsonFile)((0, path_1.join)(workspaceRoot, path))), nxJson);
    if ((0, angular_json_1.shouldMergeAngularProjects)(workspaceRoot, false)) {
        projectConfigurations = (0, angular_json_1.mergeAngularJsonAndProjects)(projectConfigurations, workspaceRoot);
    }
    perf_hooks_1.performance.mark('build-project-configs:end');
    perf_hooks_1.performance.measure('build-project-configs', 'build-project-configs:start', 'build-project-configs:end');
    return {
        version: 2,
        projects: projectConfigurations,
    };
}
function mergeTargetDefaultsIntoProjectDescriptions(projects, nxJson) {
    for (const proj of Object.values(projects)) {
        if (proj.targets) {
            for (const targetName of Object.keys(proj.targets)) {
                const projectTargetDefinition = proj.targets[targetName];
                const defaults = (0, workspaces_1.readTargetDefaultsForTarget)(targetName, nxJson.targetDefaults, projectTargetDefinition.executor);
                if (defaults) {
                    proj.targets[targetName] = (0, workspaces_1.mergeTargetConfigurations)(proj, targetName, defaults);
                }
            }
        }
    }
    return projects;
}
function configurationGlobs(workspaceRoot, nxJson) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let pluginGlobs = yield (0, workspaces_1.getGlobPatternsFromPluginsAsync)(nxJson, (0, installation_directory_1.getNxRequirePaths)(workspaceRoot), workspaceRoot);
        return [
            'project.json',
            '**/project.json',
            ...pluginGlobs,
            ...(0, workspaces_1.getGlobPatternsFromPackageManagerWorkspaces)(workspaceRoot),
        ];
    });
}
