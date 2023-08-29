"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceNrwlPackageWithNxPackage = void 0;
const nx_1 = require("../../nx");
const visit_not_ignored_files_1 = require("../generators/visit-not-ignored-files");
const path_1 = require("path");
const binary_extensions_1 = require("./binary-extensions");
const { logger } = (0, nx_1.requireNx)();
const { getProjects, updateProjectConfiguration, readNxJson, updateNxJson, updateJson, } = (0, nx_1.requireNx)();
function replaceNrwlPackageWithNxPackage(tree, oldPackageName, newPackageName) {
    replacePackageInDependencies(tree, oldPackageName, newPackageName);
    replacePackageInProjectConfigurations(tree, oldPackageName, newPackageName);
    replacePackageInNxJson(tree, oldPackageName, newPackageName);
    replaceMentions(tree, oldPackageName, newPackageName);
}
exports.replaceNrwlPackageWithNxPackage = replaceNrwlPackageWithNxPackage;
function replacePackageInDependencies(tree, oldPackageName, newPackageName) {
    (0, visit_not_ignored_files_1.visitNotIgnoredFiles)(tree, '.', (path) => {
        if ((0, path_1.basename)(path) !== 'package.json') {
            return;
        }
        try {
            updateJson(tree, path, (packageJson) => {
                var _a, _b, _c, _d;
                for (const deps of [
                    (_a = packageJson.dependencies) !== null && _a !== void 0 ? _a : {},
                    (_b = packageJson.devDependencies) !== null && _b !== void 0 ? _b : {},
                    (_c = packageJson.peerDependencies) !== null && _c !== void 0 ? _c : {},
                    (_d = packageJson.optionalDependencies) !== null && _d !== void 0 ? _d : {},
                ]) {
                    if (oldPackageName in deps) {
                        deps[newPackageName] = deps[oldPackageName];
                        delete deps[oldPackageName];
                    }
                }
                return packageJson;
            });
        }
        catch (e) {
            console.warn(`Could not replace ${oldPackageName} with ${newPackageName} in ${path}.`);
        }
    });
}
function replacePackageInProjectConfigurations(tree, oldPackageName, newPackageName) {
    var _a, _b;
    const projects = getProjects(tree);
    for (const [projectName, projectConfiguration] of projects) {
        let needsUpdate = false;
        for (const [targetName, targetConfig] of Object.entries((_a = projectConfiguration.targets) !== null && _a !== void 0 ? _a : {})) {
            if (!targetConfig.executor) {
                continue;
            }
            const [pkg, executorName] = targetConfig.executor.split(':');
            if (pkg === oldPackageName) {
                needsUpdate = true;
                projectConfiguration.targets[targetName].executor =
                    newPackageName + ':' + executorName;
            }
        }
        for (const [collection, collectionDefaults] of Object.entries((_b = projectConfiguration.generators) !== null && _b !== void 0 ? _b : {})) {
            if (collection === oldPackageName) {
                needsUpdate = true;
                projectConfiguration.generators[newPackageName] = collectionDefaults;
                delete projectConfiguration.generators[collection];
            }
        }
        if (needsUpdate) {
            updateProjectConfiguration(tree, projectName, projectConfiguration);
        }
    }
}
function replacePackageInNxJson(tree, oldPackageName, newPackageName) {
    var _a, _b;
    if (!tree.exists('nx.json')) {
        return;
    }
    const nxJson = readNxJson(tree);
    let needsUpdate = false;
    for (const [targetName, targetConfig] of Object.entries((_a = nxJson.targetDefaults) !== null && _a !== void 0 ? _a : {})) {
        if (!targetConfig.executor) {
            continue;
        }
        const [pkg, executorName] = targetConfig.executor.split(':');
        if (pkg === oldPackageName) {
            needsUpdate = true;
            nxJson.targetDefaults[targetName].executor =
                newPackageName + ':' + executorName;
        }
    }
    for (const [collection, collectionDefaults] of Object.entries((_b = nxJson.generators) !== null && _b !== void 0 ? _b : {})) {
        if (collection === oldPackageName) {
            needsUpdate = true;
            nxJson.generators[newPackageName] = collectionDefaults;
            delete nxJson.generators[collection];
        }
    }
    if (needsUpdate) {
        updateNxJson(tree, nxJson);
    }
}
function replaceMentions(tree, oldPackageName, newPackageName) {
    (0, visit_not_ignored_files_1.visitNotIgnoredFiles)(tree, '.', (path) => {
        if ((0, binary_extensions_1.isBinaryPath)(path)) {
            return;
        }
        const ignoredFiles = [
            'yarn.lock',
            'package-lock.json',
            'pnpm-lock.yaml',
            'CHANGELOG.md',
        ];
        if (ignoredFiles.includes((0, path_1.basename)(path))) {
            return;
        }
        try {
            const contents = tree.read(path).toString();
            if (!contents.includes(oldPackageName)) {
                return;
            }
            tree.write(path, contents.replace(new RegExp(oldPackageName, 'g'), newPackageName));
        }
        catch (_a) {
            // Its **probably** ok, contents can be null if the file is too large or
            // there was an access exception.
            logger.warn(`An error was thrown when trying to update ${path}. If you believe the migration should have updated it, be sure to review the file and open an issue.`);
        }
    });
}
