"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printFinalMessage = exports.markRootPackageJsonAsNxProject = exports.addVsCodeRecommendedExtensions = exports.initCloud = exports.runInstall = exports.addDepsToPackageJson = exports.createNxJsonFile = exports.askAboutNxCloud = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const enquirer = require("enquirer");
const path_1 = require("path");
const versions_1 = require("../../../utils/versions");
const child_process_2 = require("../../../utils/child-process");
const fileutils_1 = require("../../../utils/fileutils");
const output_1 = require("../../../utils/output");
const package_manager_1 = require("../../../utils/package-manager");
const path_2 = require("../../../utils/path");
function askAboutNxCloud() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return yield enquirer
            .prompt([
            {
                name: 'NxCloud',
                message: `Enable distributed caching to make your CI faster`,
                type: 'autocomplete',
                choices: [
                    {
                        name: 'Yes',
                        hint: 'I want faster builds',
                    },
                    {
                        name: 'No',
                    },
                ],
                initial: 'Yes',
            },
        ])
            .then((a) => a.NxCloud === 'Yes');
    });
}
exports.askAboutNxCloud = askAboutNxCloud;
function createNxJsonFile(repoRoot, targetDefaults, cacheableOperations, scriptOutputs) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var _k, _l, _m, _o, _p, _q;
    const nxJsonPath = (0, path_2.joinPathFragments)(repoRoot, 'nx.json');
    let nxJson = {};
    try {
        nxJson = (0, fileutils_1.readJsonFile)(nxJsonPath);
        // eslint-disable-next-line no-empty
    }
    catch (_r) { }
    (_a = nxJson.tasksRunnerOptions) !== null && _a !== void 0 ? _a : (nxJson.tasksRunnerOptions = {});
    (_b = (_k = nxJson.tasksRunnerOptions).default) !== null && _b !== void 0 ? _b : (_k.default = {});
    (_c = (_l = nxJson.tasksRunnerOptions.default).runner) !== null && _c !== void 0 ? _c : (_l.runner = 'nx/tasks-runners/default');
    (_d = (_m = nxJson.tasksRunnerOptions.default).options) !== null && _d !== void 0 ? _d : (_m.options = {});
    nxJson.tasksRunnerOptions.default.options.cacheableOperations =
        cacheableOperations;
    if (targetDefaults.length > 0) {
        (_e = nxJson.targetDefaults) !== null && _e !== void 0 ? _e : (nxJson.targetDefaults = {});
        for (const scriptName of targetDefaults) {
            (_f = (_o = nxJson.targetDefaults)[scriptName]) !== null && _f !== void 0 ? _f : (_o[scriptName] = {});
            nxJson.targetDefaults[scriptName] = { dependsOn: [`^${scriptName}`] };
        }
        for (const [scriptName, output] of Object.entries(scriptOutputs)) {
            if (!output) {
                // eslint-disable-next-line no-continue
                continue;
            }
            (_g = (_p = nxJson.targetDefaults)[scriptName]) !== null && _g !== void 0 ? _g : (_p[scriptName] = {});
            nxJson.targetDefaults[scriptName].outputs = [`{projectRoot}/${output}`];
        }
    }
    (_h = nxJson.affected) !== null && _h !== void 0 ? _h : (nxJson.affected = {});
    (_j = (_q = nxJson.affected).defaultBase) !== null && _j !== void 0 ? _j : (_q.defaultBase = deduceDefaultBase());
    (0, fileutils_1.writeJsonFile)(nxJsonPath, nxJson);
}
exports.createNxJsonFile = createNxJsonFile;
function deduceDefaultBase() {
    try {
        (0, child_process_1.execSync)(`git rev-parse --verify main`, {
            stdio: ['ignore', 'ignore', 'ignore'],
        });
        return 'main';
    }
    catch (_a) {
        try {
            (0, child_process_1.execSync)(`git rev-parse --verify dev`, {
                stdio: ['ignore', 'ignore', 'ignore'],
            });
            return 'dev';
        }
        catch (_b) {
            try {
                (0, child_process_1.execSync)(`git rev-parse --verify develop`, {
                    stdio: ['ignore', 'ignore', 'ignore'],
                });
                return 'develop';
            }
            catch (_c) {
                try {
                    (0, child_process_1.execSync)(`git rev-parse --verify next`, {
                        stdio: ['ignore', 'ignore', 'ignore'],
                    });
                    return 'next';
                }
                catch (_d) {
                    return 'master';
                }
            }
        }
    }
}
function addDepsToPackageJson(repoRoot, useCloud) {
    const path = (0, path_2.joinPathFragments)(repoRoot, `package.json`);
    const json = (0, fileutils_1.readJsonFile)(path);
    if (!json.devDependencies)
        json.devDependencies = {};
    json.devDependencies['nx'] = versions_1.nxVersion;
    if (useCloud) {
        json.devDependencies['nx-cloud'] = 'latest';
    }
    (0, fileutils_1.writeJsonFile)(path, json);
}
exports.addDepsToPackageJson = addDepsToPackageJson;
function runInstall(repoRoot, pmc = (0, package_manager_1.getPackageManagerCommand)()) {
    (0, child_process_1.execSync)(pmc.install, { stdio: [0, 1, 2], cwd: repoRoot });
}
exports.runInstall = runInstall;
function initCloud(repoRoot, installationSource) {
    (0, child_process_2.runNxSync)(`g nx-cloud:init --installationSource=${installationSource}`, {
        stdio: [0, 1, 2],
        cwd: repoRoot,
    });
}
exports.initCloud = initCloud;
function addVsCodeRecommendedExtensions(repoRoot, extensions) {
    var _a;
    const vsCodeExtensionsPath = (0, path_1.join)(repoRoot, '.vscode/extensions.json');
    if ((0, fileutils_1.fileExists)(vsCodeExtensionsPath)) {
        const vsCodeExtensionsJson = (0, fileutils_1.readJsonFile)(vsCodeExtensionsPath);
        (_a = vsCodeExtensionsJson.recommendations) !== null && _a !== void 0 ? _a : (vsCodeExtensionsJson.recommendations = []);
        extensions.forEach((extension) => {
            if (!vsCodeExtensionsJson.recommendations.includes(extension)) {
                vsCodeExtensionsJson.recommendations.push(extension);
            }
        });
        (0, fileutils_1.writeJsonFile)(vsCodeExtensionsPath, vsCodeExtensionsJson);
    }
    else {
        (0, fileutils_1.writeJsonFile)(vsCodeExtensionsPath, { recommendations: extensions });
    }
}
exports.addVsCodeRecommendedExtensions = addVsCodeRecommendedExtensions;
function markRootPackageJsonAsNxProject(repoRoot, cacheableScripts, scriptOutputs, pmc) {
    const json = (0, fileutils_1.readJsonFile)((0, path_2.joinPathFragments)(repoRoot, `package.json`));
    json.nx = { targets: {} };
    for (let script of Object.keys(scriptOutputs)) {
        if (scriptOutputs[script]) {
            json.nx.targets[script] = {
                outputs: [`{projectRoot}/${scriptOutputs[script]}`],
            };
        }
    }
    for (let script of cacheableScripts) {
        const scriptDefinition = json.scripts[script];
        if (!scriptDefinition) {
            continue;
        }
        if (scriptDefinition.includes('&&') || scriptDefinition.includes('||')) {
            let backingScriptName = `_${script}`;
            json.scripts[backingScriptName] = scriptDefinition;
            json.scripts[script] = `nx exec -- ${pmc.run(backingScriptName, '')}`;
        }
        else {
            json.scripts[script] = `nx exec -- ${json.scripts[script]}`;
        }
    }
    (0, fileutils_1.writeJsonFile)(`package.json`, json);
}
exports.markRootPackageJsonAsNxProject = markRootPackageJsonAsNxProject;
function printFinalMessage({ learnMoreLink, bodyLines, }) {
    const normalizedBodyLines = (bodyLines !== null && bodyLines !== void 0 ? bodyLines : []).map((l) => l.startsWith('- ') ? l : `- ${l}`);
    output_1.output.success({
        title: '🎉 Done!',
        bodyLines: [
            '- Enabled computation caching!',
            ...normalizedBodyLines,
            learnMoreLink ? `- Learn more at ${learnMoreLink}.` : undefined,
        ].filter(Boolean),
    });
}
exports.printFinalMessage = printFinalMessage;
