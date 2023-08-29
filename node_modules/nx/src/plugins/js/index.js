"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processProjectGraph = void 0;
const tslib_1 = require("tslib");
const project_graph_builder_1 = require("../../project-graph/project-graph-builder");
const build_dependencies_1 = require("./project-graph/build-dependencies/build-dependencies");
const configuration_1 = require("../../config/configuration");
const fileutils_1 = require("../../utils/fileutils");
const lock_file_1 = require("./lock-file/lock-file");
const path_1 = require("path");
const cache_directory_1 = require("../../utils/cache-directory");
const fs_1 = require("fs");
const workspace_root_1 = require("../../utils/workspace-root");
const fs_extra_1 = require("fs-extra");
const processProjectGraph = (graph, context) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const builder = new project_graph_builder_1.ProjectGraphBuilder(graph, context.fileMap);
    const pluginConfig = jsPluginConfig((0, configuration_1.readNxJson)());
    if (pluginConfig.analyzePackageJson) {
        // during the create-nx-workspace lock file might not exists yet
        if ((0, lock_file_1.lockFileExists)()) {
            const lockHash = (0, lock_file_1.lockFileHash)();
            let parsedLockFile;
            if (lockFileNeedsReprocessing(lockHash)) {
                parsedLockFile = (0, lock_file_1.parseLockFile)();
                writeLastProcessedLockfileHash(lockHash, parsedLockFile);
            }
            else {
                parsedLockFile = readParsedLockFile();
            }
            builder.mergeProjectGraph(parsedLockFile);
        }
    }
    yield (0, build_dependencies_1.buildExplicitDependencies)(pluginConfig, context, builder);
    return builder.getUpdatedProjectGraph();
});
exports.processProjectGraph = processProjectGraph;
const lockFileHashFile = (0, path_1.join)(cache_directory_1.projectGraphCacheDirectory, 'lockfile.hash');
const parsedLockFile = (0, path_1.join)(cache_directory_1.projectGraphCacheDirectory, 'parsed-lock-file.json');
function lockFileNeedsReprocessing(lockHash) {
    try {
        return (0, fs_1.readFileSync)(lockFileHashFile).toString() !== lockHash;
    }
    catch (_a) {
        return true;
    }
}
function writeLastProcessedLockfileHash(hash, lockFile) {
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(lockFileHashFile));
    (0, fs_1.writeFileSync)(parsedLockFile, JSON.stringify(lockFile, null, 2));
    (0, fs_1.writeFileSync)(lockFileHashFile, hash);
}
function readParsedLockFile() {
    return JSON.parse((0, fs_1.readFileSync)(parsedLockFile).toString());
}
function jsPluginConfig(nxJson) {
    var _a, _b, _c;
    const nxJsonConfig = (_b = (_a = nxJson === null || nxJson === void 0 ? void 0 : nxJson.pluginsConfig) === null || _a === void 0 ? void 0 : _a['@nx/js']) !== null && _b !== void 0 ? _b : (_c = nxJson === null || nxJson === void 0 ? void 0 : nxJson.pluginsConfig) === null || _c === void 0 ? void 0 : _c['@nrwl/js'];
    if (nxJsonConfig) {
        return Object.assign({ analyzePackageJson: true, analyzeSourceFiles: true }, nxJsonConfig);
    }
    if (!(0, fileutils_1.fileExists)((0, path_1.join)(workspace_root_1.workspaceRoot, 'package.json'))) {
        return {
            analyzePackageJson: false,
            analyzeSourceFiles: false,
        };
    }
    const packageJson = (0, fileutils_1.readJsonFile)((0, path_1.join)(workspace_root_1.workspaceRoot, 'package.json'));
    const packageJsonDeps = Object.assign(Object.assign({}, packageJson.dependencies), packageJson.devDependencies);
    if (packageJsonDeps['@nx/workspace'] ||
        packageJsonDeps['@nx/js'] ||
        packageJsonDeps['@nx/node'] ||
        packageJsonDeps['@nx/next'] ||
        packageJsonDeps['@nx/react'] ||
        packageJsonDeps['@nx/angular'] ||
        packageJsonDeps['@nx/web'] ||
        packageJsonDeps['@nrwl/workspace'] ||
        packageJsonDeps['@nrwl/js'] ||
        packageJsonDeps['@nrwl/node'] ||
        packageJsonDeps['@nrwl/next'] ||
        packageJsonDeps['@nrwl/react'] ||
        packageJsonDeps['@nrwl/angular'] ||
        packageJsonDeps['@nrwl/web']) {
        return { analyzePackageJson: true, analyzeSourceFiles: true };
    }
    else {
        return { analyzePackageJson: true, analyzeSourceFiles: false };
    }
}
