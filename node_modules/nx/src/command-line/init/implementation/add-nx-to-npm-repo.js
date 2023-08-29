"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNxToNpmRepo = void 0;
const tslib_1 = require("tslib");
const enquirer = require("enquirer");
const fileutils_1 = require("../../../utils/fileutils");
const output_1 = require("../../../utils/output");
const package_manager_1 = require("../../../utils/package-manager");
const utils_1 = require("./utils");
function addNxToNpmRepo(options) {
    var _a, _b, _c, _d;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const repoRoot = process.cwd();
        output_1.output.log({ title: '🐳 Nx initialization' });
        let cacheableOperations;
        let scriptOutputs = {};
        let useNxCloud;
        const packageJson = (0, fileutils_1.readJsonFile)('package.json');
        const scripts = Object.keys((_a = packageJson.scripts) !== null && _a !== void 0 ? _a : {}).filter((s) => !s.startsWith('pre') && !s.startsWith('post'));
        if (options.interactive && scripts.length > 0) {
            output_1.output.log({
                title: '🧑‍🔧 Please answer the following questions about the scripts found in your package.json in order to generate task runner configuration',
            });
            cacheableOperations = (yield enquirer.prompt([
                {
                    type: 'multiselect',
                    name: 'cacheableOperations',
                    message: 'Which of the following scripts are cacheable? (Produce the same output given the same input, e.g. build, test and lint usually are, serve and start are not). You can use spacebar to select one or more scripts.',
                    choices: scripts,
                },
            ])).cacheableOperations;
            for (const scriptName of cacheableOperations) {
                // eslint-disable-next-line no-await-in-loop
                scriptOutputs[scriptName] = (yield enquirer.prompt([
                    {
                        type: 'input',
                        name: scriptName,
                        message: `Does the "${scriptName}" script create any outputs? If not, leave blank, otherwise provide a path (e.g. dist, lib, build, coverage)`,
                    },
                ]))[scriptName];
            }
            useNxCloud = (_b = options.nxCloud) !== null && _b !== void 0 ? _b : (yield (0, utils_1.askAboutNxCloud)());
        }
        else {
            cacheableOperations = (_c = options.cacheable) !== null && _c !== void 0 ? _c : [];
            useNxCloud =
                (_d = options.nxCloud) !== null && _d !== void 0 ? _d : (options.interactive ? yield (0, utils_1.askAboutNxCloud)() : false);
        }
        (0, utils_1.createNxJsonFile)(repoRoot, [], cacheableOperations, {});
        const pmc = (0, package_manager_1.getPackageManagerCommand)();
        (0, utils_1.addDepsToPackageJson)(repoRoot, useNxCloud);
        (0, utils_1.markRootPackageJsonAsNxProject)(repoRoot, cacheableOperations, scriptOutputs, pmc);
        output_1.output.log({ title: '📦 Installing dependencies' });
        (0, utils_1.runInstall)(repoRoot, pmc);
        if (useNxCloud) {
            output_1.output.log({ title: '🛠️ Setting up Nx Cloud' });
            (0, utils_1.initCloud)(repoRoot, 'nx-init-npm-repo');
        }
        (0, utils_1.printFinalMessage)({
            learnMoreLink: 'https://nx.dev/recipes/adopting-nx/adding-to-existing-project',
        });
    });
}
exports.addNxToNpmRepo = addNxToNpmRepo;
