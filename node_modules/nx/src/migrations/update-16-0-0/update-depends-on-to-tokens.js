"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const project_configuration_1 = require("../../generators/utils/project-configuration");
const format_changed_files_with_prettier_if_available_1 = require("../../generators/internal-utils/format-changed-files-with-prettier-if-available");
function default_1(tree) {
    var _a, _b, _c, _d;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        updateDependsOnAndInputsInsideNxJson(tree);
        const projectsConfigurations = (0, project_configuration_1.getProjects)(tree);
        for (const [projectName, projectConfiguration] of projectsConfigurations) {
            let projectChanged = false;
            for (const [targetName, targetConfiguration] of Object.entries((_a = projectConfiguration.targets) !== null && _a !== void 0 ? _a : {})) {
                for (const dependency of (_b = targetConfiguration.dependsOn) !== null && _b !== void 0 ? _b : []) {
                    if (typeof dependency !== 'string') {
                        if (dependency.projects === 'self' ||
                            dependency.projects === '{self}') {
                            delete dependency.projects;
                            projectChanged = true;
                        }
                        else if (dependency.projects === 'dependencies' ||
                            dependency.projects === '{dependencies}') {
                            delete dependency.projects;
                            dependency.dependencies = true;
                            projectChanged = true;
                        }
                    }
                }
                for (let i = 0; (_d = i < ((_c = targetConfiguration.inputs) === null || _c === void 0 ? void 0 : _c.length)) !== null && _d !== void 0 ? _d : 0; i++) {
                    const input = targetConfiguration.inputs[i];
                    if (typeof input !== 'string') {
                        if ('projects' in input &&
                            (input.projects === 'self' || input.projects === '{self}')) {
                            delete input.projects;
                            projectChanged = true;
                        }
                        else if ('projects' in input &&
                            (input.projects === 'dependencies' ||
                                input.projects === '{dependencies}')) {
                            delete input.projects;
                            targetConfiguration.inputs[i] = Object.assign(Object.assign({}, input), { dependencies: true });
                            projectChanged = true;
                        }
                    }
                }
            }
            if (projectChanged) {
                (0, project_configuration_1.updateProjectConfiguration)(tree, projectName, projectConfiguration);
            }
        }
        yield (0, format_changed_files_with_prettier_if_available_1.formatChangedFilesWithPrettierIfAvailable)(tree);
    });
}
exports.default = default_1;
function updateDependsOnAndInputsInsideNxJson(tree) {
    var _a, _b, _c, _d;
    const nxJson = (0, project_configuration_1.readNxJson)(tree);
    let nxJsonChanged = false;
    for (const [target, defaults] of Object.entries((_a = nxJson === null || nxJson === void 0 ? void 0 : nxJson.targetDefaults) !== null && _a !== void 0 ? _a : {})) {
        for (const dependency of (_b = defaults.dependsOn) !== null && _b !== void 0 ? _b : []) {
            if (typeof dependency !== 'string') {
                if (dependency.projects === 'self' ||
                    dependency.projects === '{self}') {
                    delete dependency.projects;
                    nxJsonChanged = true;
                }
                else if (dependency.projects === 'dependencies' ||
                    dependency.projects === '{dependencies}') {
                    delete dependency.projects;
                    dependency.dependencies = true;
                    nxJsonChanged = true;
                }
            }
        }
        for (let i = 0; (_d = i < ((_c = defaults.inputs) === null || _c === void 0 ? void 0 : _c.length)) !== null && _d !== void 0 ? _d : 0; i++) {
            const input = defaults.inputs[i];
            if (typeof input !== 'string') {
                if ('projects' in input &&
                    (input.projects === 'self' || input.projects === '{self}')) {
                    delete input.projects;
                    nxJsonChanged = true;
                }
                else if ('projects' in input &&
                    (input.projects === 'dependencies' ||
                        input.projects === '{dependencies}')) {
                    delete input.projects;
                    defaults.inputs[i] = Object.assign(Object.assign({}, input), { dependencies: true });
                    nxJsonChanged = true;
                }
            }
        }
    }
    if (nxJsonChanged) {
        (0, project_configuration_1.updateNxJson)(tree, nxJson);
    }
}
