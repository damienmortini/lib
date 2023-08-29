"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNxToAngularCliRepo = void 0;
const tslib_1 = require("tslib");
const enquirer_1 = require("enquirer");
const path_1 = require("path");
const fileutils_1 = require("../../../../utils/fileutils");
const versions_1 = require("../../../../utils/versions");
const object_sort_1 = require("../../../../utils/object-sort");
const output_1 = require("../../../../utils/output");
const utils_1 = require("../utils");
const integrated_workspace_1 = require("./integrated-workspace");
const legacy_angular_versions_1 = require("./legacy-angular-versions");
const standalone_workspace_1 = require("./standalone-workspace");
const defaultCacheableOperations = [
    'build',
    'server',
    'test',
    'lint',
];
let repoRoot;
let workspaceTargets;
function addNxToAngularCliRepo(options) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        repoRoot = process.cwd();
        output_1.output.log({ title: '🧐 Checking versions compatibility' });
        const legacyMigrationFn = yield (0, legacy_angular_versions_1.getLegacyMigrationFunctionIfApplicable)(repoRoot, options);
        if (legacyMigrationFn) {
            output_1.output.log({ title: '💽 Running migration for a legacy Angular version' });
            yield legacyMigrationFn();
            process.exit(0);
        }
        output_1.output.success({
            title: '✅ The Angular version is compatible with the latest version of Nx!',
        });
        output_1.output.log({ title: '🐳 Nx initialization' });
        const cacheableOperations = !options.integrated
            ? yield collectCacheableOperations(options)
            : [];
        const useNxCloud = (_a = options.nxCloud) !== null && _a !== void 0 ? _a : (options.interactive ? yield (0, utils_1.askAboutNxCloud)() : false);
        output_1.output.log({ title: '📦 Installing dependencies' });
        installDependencies(useNxCloud);
        output_1.output.log({ title: '📝 Setting up workspace' });
        yield setupWorkspace(cacheableOperations, options.integrated);
        if (useNxCloud) {
            output_1.output.log({ title: '🛠️ Setting up Nx Cloud' });
            (0, utils_1.initCloud)(repoRoot, 'nx-init-angular');
        }
        (0, utils_1.printFinalMessage)({
            learnMoreLink: 'https://nx.dev/recipes/adopting-nx/migration-angular',
            bodyLines: [
                '- Execute "npx nx build" twice to see the computation caching in action.',
            ],
        });
    });
}
exports.addNxToAngularCliRepo = addNxToAngularCliRepo;
function collectCacheableOperations(options) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let cacheableOperations;
        workspaceTargets = getWorkspaceTargets();
        const defaultCacheableTargetsInWorkspace = defaultCacheableOperations.filter((t) => workspaceTargets.includes(t));
        if (options.interactive && workspaceTargets.length > 0) {
            output_1.output.log({
                title: '🧑‍🔧 Please answer the following questions about the targets found in your angular.json in order to generate task runner configuration',
            });
            cacheableOperations = (yield (0, enquirer_1.prompt)([
                {
                    type: 'multiselect',
                    name: 'cacheableOperations',
                    initial: defaultCacheableTargetsInWorkspace,
                    message: 'Which of the following targets are cacheable? (Produce the same output given the same input, e.g. build, test and lint usually are, serve and start are not)',
                    // enquirer mutates the array below, create a new one to avoid it
                    choices: [...workspaceTargets],
                },
            ])).cacheableOperations;
        }
        else {
            cacheableOperations =
                (_a = options.cacheable) !== null && _a !== void 0 ? _a : defaultCacheableTargetsInWorkspace;
        }
        return cacheableOperations;
    });
}
function installDependencies(useNxCloud) {
    (0, utils_1.addDepsToPackageJson)(repoRoot, useNxCloud);
    addPluginDependencies();
    (0, utils_1.runInstall)(repoRoot);
}
function addPluginDependencies() {
    var _a, _b, _c, _d, _e, _f, _g;
    const packageJsonPath = (0, path_1.join)(repoRoot, 'package.json');
    const packageJson = (0, fileutils_1.readJsonFile)(packageJsonPath);
    (_a = packageJson.devDependencies) !== null && _a !== void 0 ? _a : (packageJson.devDependencies = {});
    packageJson.devDependencies['@nx/angular'] = versions_1.nxVersion;
    packageJson.devDependencies['@nx/workspace'] = versions_1.nxVersion;
    const peerDepsToInstall = [
        '@angular-devkit/core',
        '@angular-devkit/schematics',
        '@schematics/angular',
    ];
    const angularCliVersion = (_e = (_d = (_b = packageJson.devDependencies['@angular/cli']) !== null && _b !== void 0 ? _b : (_c = packageJson.dependencies) === null || _c === void 0 ? void 0 : _c['@angular/cli']) !== null && _d !== void 0 ? _d : packageJson.devDependencies['@angular-devkit/build-angular']) !== null && _e !== void 0 ? _e : (_f = packageJson.dependencies) === null || _f === void 0 ? void 0 : _f['@angular-devkit/build-angular'];
    for (const dep of peerDepsToInstall) {
        if (!packageJson.devDependencies[dep] && !((_g = packageJson.dependencies) === null || _g === void 0 ? void 0 : _g[dep])) {
            packageJson.devDependencies[dep] = angularCliVersion;
        }
    }
    packageJson.devDependencies = (0, object_sort_1.sortObjectByKeys)(packageJson.devDependencies);
    (0, fileutils_1.writeJsonFile)(packageJsonPath, packageJson);
}
function setupWorkspace(cacheableOperations, isIntegratedMigration) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (isIntegratedMigration) {
            (0, integrated_workspace_1.setupIntegratedWorkspace)();
        }
        else {
            yield (0, standalone_workspace_1.setupStandaloneWorkspace)(repoRoot, cacheableOperations, workspaceTargets);
        }
    });
}
function getWorkspaceTargets() {
    var _a;
    const { projects } = (0, fileutils_1.readJsonFile)((0, path_1.join)(repoRoot, 'angular.json'));
    const targets = new Set();
    for (const project of Object.values(projects !== null && projects !== void 0 ? projects : {})) {
        for (const target of Object.keys((_a = project.architect) !== null && _a !== void 0 ? _a : {})) {
            targets.add(target);
        }
    }
    return Array.from(targets);
}
