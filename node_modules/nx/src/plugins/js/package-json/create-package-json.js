"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findProjectsNpmDependencies = exports.createPackageJson = void 0;
const fileutils_1 = require("../../../utils/fileutils");
const object_sort_1 = require("../../../utils/object-sort");
const project_graph_1 = require("../../../config/project-graph");
const fs_1 = require("fs");
const workspace_root_1 = require("../../../utils/workspace-root");
const task_hasher_1 = require("../../../hasher/task-hasher");
const configuration_1 = require("../../../config/configuration");
const nx_deps_cache_1 = require("../../../project-graph/nx-deps-cache");
const path_1 = require("path");
/**
 * Creates a package.json in the output directory for support to install dependencies within containers.
 *
 * If a package.json exists in the project, it will reuse that.
 * If isProduction flag is set, it wil  remove devDependencies and optional peerDependencies
 */
function createPackageJson(projectName, graph, options = {}, fileMap = null) {
    const projectNode = graph.nodes[projectName];
    const isLibrary = projectNode.type === 'lib';
    const rootPackageJson = (0, fileutils_1.readJsonFile)(`${options.root || workspace_root_1.workspaceRoot}/package.json`);
    const npmDeps = findProjectsNpmDependencies(projectNode, graph, options.target, rootPackageJson, {
        helperDependencies: options.helperDependencies,
        isProduction: options.isProduction,
    }, fileMap);
    // default package.json if one does not exist
    let packageJson = {
        name: projectName,
        version: '0.0.1',
    };
    const projectPackageJsonPath = (0, path_1.join)(options.root || workspace_root_1.workspaceRoot, projectNode.data.root, 'package.json');
    if ((0, fs_1.existsSync)(projectPackageJsonPath)) {
        try {
            packageJson = (0, fileutils_1.readJsonFile)(projectPackageJsonPath);
            // for standalone projects we don't want to include all the root dependencies
            if (graph.nodes[projectName].data.root === '.') {
                // TODO: We should probably think more on this - Nx can't always
                // detect all external dependencies, and there's not a way currently
                // to tell Nx that we need one of these deps. For non-standalone projects
                // we tell people to add it to the package.json of the project, and we
                // merge it. For standalone, this pattern doesn't work because of this piece of code.
                // It breaks expectations, but also, I don't know another way around it currently.
                // If Nx doesn't pick up a dep, say some css lib that is only imported in a .scss file,
                // we need to be able to tell it to keep that dep in the generated package.json.
                delete packageJson.dependencies;
                delete packageJson.devDependencies;
            }
        }
        catch (e) { }
    }
    const getVersion = (packageName, version, section) => {
        var _a;
        return (packageJson[section][packageName] ||
            (isLibrary && ((_a = rootPackageJson[section]) === null || _a === void 0 ? void 0 : _a[packageName])) ||
            version);
    };
    Object.entries(npmDeps.dependencies).forEach(([packageName, version]) => {
        var _a, _b, _c, _d, _e, _f;
        if (((_a = rootPackageJson.devDependencies) === null || _a === void 0 ? void 0 : _a[packageName]) &&
            !((_b = packageJson.dependencies) === null || _b === void 0 ? void 0 : _b[packageName]) &&
            !((_c = packageJson.peerDependencies) === null || _c === void 0 ? void 0 : _c[packageName])) {
            // don't store dev dependencies for production
            if (!options.isProduction) {
                (_d = packageJson.devDependencies) !== null && _d !== void 0 ? _d : (packageJson.devDependencies = {});
                packageJson.devDependencies[packageName] = getVersion(packageName, version, 'devDependencies');
            }
        }
        else {
            if (!((_e = packageJson.peerDependencies) === null || _e === void 0 ? void 0 : _e[packageName])) {
                (_f = packageJson.dependencies) !== null && _f !== void 0 ? _f : (packageJson.dependencies = {});
                packageJson.dependencies[packageName] = getVersion(packageName, version, 'dependencies');
            }
        }
    });
    if (!isLibrary) {
        Object.entries(npmDeps.peerDependencies).forEach(([packageName, version]) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            if (!((_a = packageJson.peerDependencies) === null || _a === void 0 ? void 0 : _a[packageName])) {
                if ((_b = rootPackageJson.dependencies) === null || _b === void 0 ? void 0 : _b[packageName]) {
                    (_c = packageJson.dependencies) !== null && _c !== void 0 ? _c : (packageJson.dependencies = {});
                    packageJson.dependencies[packageName] = getVersion(packageName, version, 'dependencies');
                    return;
                }
                const isOptionalPeer = (_d = npmDeps.peerDependenciesMeta[packageName]) === null || _d === void 0 ? void 0 : _d.optional;
                if (!isOptionalPeer) {
                    if (!options.isProduction ||
                        ((_e = rootPackageJson.dependencies) === null || _e === void 0 ? void 0 : _e[packageName])) {
                        (_f = packageJson.peerDependencies) !== null && _f !== void 0 ? _f : (packageJson.peerDependencies = {});
                        packageJson.peerDependencies[packageName] = getVersion(packageName, version, 'dependencies');
                    }
                }
                else if (!options.isProduction) {
                    // add peer optional dependencies if not in production
                    (_g = packageJson.peerDependencies) !== null && _g !== void 0 ? _g : (packageJson.peerDependencies = {});
                    packageJson.peerDependencies[packageName] = version;
                    (_h = packageJson.peerDependenciesMeta) !== null && _h !== void 0 ? _h : (packageJson.peerDependenciesMeta = {});
                    packageJson.peerDependenciesMeta[packageName] = {
                        optional: true,
                    };
                }
            }
        });
    }
    packageJson.devDependencies && (packageJson.devDependencies = (0, object_sort_1.sortObjectByKeys)(packageJson.devDependencies));
    packageJson.dependencies && (packageJson.dependencies = (0, object_sort_1.sortObjectByKeys)(packageJson.dependencies));
    packageJson.peerDependencies && (packageJson.peerDependencies = (0, object_sort_1.sortObjectByKeys)(packageJson.peerDependencies));
    packageJson.peerDependenciesMeta && (packageJson.peerDependenciesMeta = (0, object_sort_1.sortObjectByKeys)(packageJson.peerDependenciesMeta));
    return packageJson;
}
exports.createPackageJson = createPackageJson;
function findProjectsNpmDependencies(projectNode, graph, target, rootPackageJson, options, fileMap) {
    var _a, _b;
    if (fileMap == null) {
        fileMap = ((_a = (0, nx_deps_cache_1.readProjectFileMapCache)()) === null || _a === void 0 ? void 0 : _a.projectFileMap) || {};
    }
    const { selfInputs, dependencyInputs } = target
        ? (0, task_hasher_1.getTargetInputs)((0, configuration_1.readNxJson)(), projectNode, target)
        : { selfInputs: [], dependencyInputs: [] };
    const npmDeps = {
        dependencies: {},
        peerDependencies: {},
        peerDependenciesMeta: {},
    };
    const seen = new Set();
    (_b = options.helperDependencies) === null || _b === void 0 ? void 0 : _b.forEach((dep) => {
        seen.add(dep);
        npmDeps.dependencies[graph.externalNodes[dep].data.packageName] =
            graph.externalNodes[dep].data.version;
        recursivelyCollectPeerDependencies(dep, graph, npmDeps, seen);
    });
    // if it's production, we want to ignore all found devDependencies
    const ignoredDependencies = options.isProduction && rootPackageJson.devDependencies
        ? [
            ...(options.ignoredDependencies || []),
            ...Object.keys(rootPackageJson.devDependencies),
        ]
        : options.ignoredDependencies || [];
    findAllNpmDeps(fileMap, projectNode, graph, npmDeps, seen, ignoredDependencies, dependencyInputs, selfInputs);
    return npmDeps;
}
exports.findProjectsNpmDependencies = findProjectsNpmDependencies;
function findAllNpmDeps(projectFileMap, projectNode, graph, npmDeps, seen, ignoredDependencies, dependencyPatterns, rootPatterns) {
    if (seen.has(projectNode.name))
        return;
    seen.add(projectNode.name);
    const projectFiles = (0, task_hasher_1.filterUsingGlobPatterns)(projectNode.data.root, projectFileMap[projectNode.name] || [], rootPatterns !== null && rootPatterns !== void 0 ? rootPatterns : dependencyPatterns);
    const projectDependencies = new Set();
    projectFiles.forEach((fileData) => {
        var _a;
        return (_a = fileData.deps) === null || _a === void 0 ? void 0 : _a.forEach((dep) => projectDependencies.add((0, project_graph_1.fileDataDepTarget)(dep)));
    });
    for (const dep of projectDependencies) {
        const node = graph.externalNodes[dep];
        if (seen.has(dep)) {
            // if it's in peerDependencies, move it to regular dependencies
            // since this is a direct dependency of the project
            if (node && npmDeps.peerDependencies[node.data.packageName]) {
                npmDeps.dependencies[node.data.packageName] = node.data.version;
                delete npmDeps.peerDependencies[node.data.packageName];
            }
        }
        else {
            if (node) {
                seen.add(dep);
                // do not add ignored dependencies to the list or non-npm dependencies
                if (ignoredDependencies.includes(node.data.packageName) ||
                    node.type !== 'npm') {
                    continue;
                }
                npmDeps.dependencies[node.data.packageName] = node.data.version;
                recursivelyCollectPeerDependencies(node.name, graph, npmDeps, seen);
            }
            else if (graph.nodes[dep]) {
                findAllNpmDeps(projectFileMap, graph.nodes[dep], graph, npmDeps, seen, ignoredDependencies, dependencyPatterns);
            }
        }
    }
}
function recursivelyCollectPeerDependencies(projectName, graph, npmDeps, seen) {
    const npmPackage = graph.externalNodes[projectName];
    if (!npmPackage) {
        return npmDeps;
    }
    const packageName = npmPackage.data.packageName;
    try {
        const packageJson = require(`${packageName}/package.json`);
        if (!packageJson.peerDependencies) {
            return npmDeps;
        }
        Object.keys(packageJson.peerDependencies)
            .map((dependencyName) => `npm:${dependencyName}`)
            .map((dependency) => graph.externalNodes[dependency])
            .filter(Boolean)
            .forEach((node) => {
            if (!seen.has(node.name)) {
                seen.add(node.name);
                npmDeps.peerDependencies[node.data.packageName] = node.data.version;
                if (packageJson.peerDependenciesMeta &&
                    packageJson.peerDependenciesMeta[node.data.packageName] &&
                    packageJson.peerDependenciesMeta[node.data.packageName].optional) {
                    npmDeps.peerDependenciesMeta[node.data.packageName] = {
                        optional: true,
                    };
                }
                recursivelyCollectPeerDependencies(node.name, graph, npmDeps, seen);
            }
        });
        return npmDeps;
    }
    catch (e) {
        return npmDeps;
    }
}
