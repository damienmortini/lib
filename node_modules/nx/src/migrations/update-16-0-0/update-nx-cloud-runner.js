"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const project_configuration_1 = require("../../generators/utils/project-configuration");
const json_1 = require("../../generators/utils/json");
function default_1(tree) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        (0, json_1.updateJson)(tree, 'package.json', (json) => {
            if (json.dependencies && json.dependencies['@nrwl/nx-cloud']) {
                json.dependencies['nx-cloud'] = json.dependencies['@nrwl/nx-cloud'];
                delete json.dependencies['@nrwl/nx-cloud'];
            }
            if (json.devDependencies && json.devDependencies['@nrwl/nx-cloud']) {
                json.devDependencies['nx-cloud'] = json.devDependencies['@nrwl/nx-cloud'];
                delete json.devDependencies['@nrwl/nx-cloud'];
            }
            return json;
        });
        const nxJson = (0, project_configuration_1.readNxJson)(tree);
        if (!nxJson)
            return;
        for (let opts of Object.values(nxJson.tasksRunnerOptions)) {
            if (opts.runner === '@nrwl/nx-cloud') {
                opts.runner = 'nx-cloud';
            }
        }
        (0, project_configuration_1.updateNxJson)(tree, nxJson);
    });
}
exports.default = default_1;
