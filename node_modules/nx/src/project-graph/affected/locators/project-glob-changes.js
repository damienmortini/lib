"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTouchedProjectsFromProjectGlobChanges = void 0;
const tslib_1 = require("tslib");
const minimatch = require("minimatch");
const workspaces_1 = require("../../../config/workspaces");
const workspace_root_1 = require("../../../utils/workspace-root");
const installation_directory_1 = require("../../../utils/installation-directory");
const path_1 = require("path");
const fs_1 = require("fs");
const getTouchedProjectsFromProjectGlobChanges = (touchedFiles, projectGraphNodes, nxJson) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const pluginGlobPatterns = yield (0, workspaces_1.getGlobPatternsFromPluginsAsync)(nxJson, (0, installation_directory_1.getNxRequirePaths)(), workspace_root_1.workspaceRoot);
    const workspacesGlobPatterns = (0, workspaces_1.getGlobPatternsFromPackageManagerWorkspaces)(workspace_root_1.workspaceRoot) || [];
    const patterns = [
        '**/project.json',
        ...pluginGlobPatterns,
        ...workspacesGlobPatterns,
    ];
    const combinedGlobPattern = patterns.length === 1
        ? '**/project.json'
        : '{' + patterns.join(',') + '}';
    const touchedProjects = new Set();
    for (const touchedFile of touchedFiles) {
        const isProjectFile = minimatch(touchedFile.file, combinedGlobPattern);
        if (isProjectFile) {
            // If the file no longer exists on disk, then it was deleted
            if (!(0, fs_1.existsSync)((0, path_1.join)(workspace_root_1.workspaceRoot, touchedFile.file))) {
                // If any project has been deleted, we must assume all projects were affected
                return Object.keys(projectGraphNodes);
            }
            // Modified project config files are under a project's root, and implicitly
            // mark it as affected. Thus, we don't need to handle it here.
        }
    }
    return Array.from(touchedProjects);
});
exports.getTouchedProjectsFromProjectGlobChanges = getTouchedProjectsFromProjectGlobChanges;
