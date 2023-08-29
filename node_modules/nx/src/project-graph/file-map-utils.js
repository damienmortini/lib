"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectFileMap = exports.createProjectFileMap = exports.createProjectFileMapUsingProjectGraph = void 0;
const tslib_1 = require("tslib");
const find_project_for_path_1 = require("./utils/find-project-for-path");
const client_1 = require("../daemon/client/client");
const project_graph_1 = require("./project-graph");
const file_hasher_1 = require("../hasher/file-hasher");
function createProjectFileMapUsingProjectGraph(graph) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const configs = (0, project_graph_1.readProjectsConfigurationFromProjectGraph)(graph);
        let files;
        if (client_1.daemonClient.enabled()) {
            files = yield client_1.daemonClient.getAllFileData();
        }
        else {
            yield file_hasher_1.fileHasher.ensureInitialized();
            files = file_hasher_1.fileHasher.allFileData();
        }
        return createProjectFileMap(configs, files).projectFileMap;
    });
}
exports.createProjectFileMapUsingProjectGraph = createProjectFileMapUsingProjectGraph;
function createProjectFileMap(projectsConfigurations, allWorkspaceFiles) {
    var _a;
    const projectFileMap = {};
    const projectRootMappings = (0, find_project_for_path_1.createProjectRootMappingsFromProjectConfigurations)(projectsConfigurations.projects);
    for (const projectName of Object.keys(projectsConfigurations.projects)) {
        (_a = projectFileMap[projectName]) !== null && _a !== void 0 ? _a : (projectFileMap[projectName] = []);
    }
    for (const f of allWorkspaceFiles) {
        const projectFileMapKey = (0, find_project_for_path_1.findProjectForPath)(f.file, projectRootMappings);
        const matchingProjectFiles = projectFileMap[projectFileMapKey];
        if (matchingProjectFiles) {
            matchingProjectFiles.push(f);
        }
    }
    return { projectFileMap, allWorkspaceFiles };
}
exports.createProjectFileMap = createProjectFileMap;
function updateProjectFileMap(projectsConfigurations, projectFileMap, allWorkspaceFiles, updatedFiles, deletedFiles) {
    var _a, _b;
    const projectRootMappings = (0, find_project_for_path_1.createProjectRootMappingsFromProjectConfigurations)(projectsConfigurations);
    for (const f of updatedFiles.keys()) {
        const matchingProjectFiles = (_a = projectFileMap[(0, find_project_for_path_1.findProjectForPath)(f, projectRootMappings)]) !== null && _a !== void 0 ? _a : [];
        if (matchingProjectFiles) {
            const fileData = matchingProjectFiles.find((t) => t.file === f);
            if (fileData) {
                fileData.hash = updatedFiles.get(f);
            }
            else {
                matchingProjectFiles.push({
                    file: f,
                    hash: updatedFiles.get(f),
                });
            }
        }
        const fileData = allWorkspaceFiles.find((t) => t.file === f);
        if (fileData) {
            fileData.hash = updatedFiles.get(f);
        }
        else {
            allWorkspaceFiles.push({
                file: f,
                hash: updatedFiles.get(f),
            });
        }
    }
    for (const f of deletedFiles) {
        const matchingProjectFiles = (_b = projectFileMap[(0, find_project_for_path_1.findProjectForPath)(f, projectRootMappings)]) !== null && _b !== void 0 ? _b : [];
        if (matchingProjectFiles) {
            const index = matchingProjectFiles.findIndex((t) => t.file === f);
            if (index > -1) {
                matchingProjectFiles.splice(index, 1);
            }
        }
        const index = allWorkspaceFiles.findIndex((t) => t.file === f);
        if (index > -1) {
            allWorkspaceFiles.splice(index, 1);
        }
    }
    return { projectFileMap, allWorkspaceFiles };
}
exports.updateProjectFileMap = updateProjectFileMap;
