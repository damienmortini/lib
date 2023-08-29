"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashTsConfig = void 0;
const tslib_1 = require("tslib");
const fileutils_1 = require("../../../utils/fileutils");
const typescript_1 = require("../utils/typescript");
const find_project_for_path_1 = require("../../../project-graph/utils/find-project-for-path");
function readTsConfigJson() {
    var _a;
    var _b;
    try {
        const res = (0, fileutils_1.readJsonFile)((0, typescript_1.getRootTsConfigFileName)());
        (_a = (_b = res.compilerOptions).paths) !== null && _a !== void 0 ? _a : (_b.paths = {});
        return res;
    }
    catch (_c) {
        return {
            compilerOptions: { paths: {} },
        };
    }
}
let tsConfigJson;
function hashTsConfig(p, projectRootMappings, { selectivelyHashTsConfig }) {
    if (!tsConfigJson) {
        tsConfigJson = readTsConfigJson();
    }
    if (selectivelyHashTsConfig) {
        return removeOtherProjectsPathRecords(p, tsConfigJson, projectRootMappings);
    }
    else {
        return JSON.stringify(tsConfigJson);
    }
}
exports.hashTsConfig = hashTsConfig;
function removeOtherProjectsPathRecords(p, tsConfigJson, projectRootMapping) {
    const _a = tsConfigJson.compilerOptions, { paths } = _a, compilerOptions = tslib_1.__rest(_a, ["paths"]);
    const filteredPaths = {};
    if (!paths) {
        return '';
    }
    for (const [key, files] of Object.entries(paths)) {
        for (const filePath of files) {
            if (p.name === (0, find_project_for_path_1.findProjectForPath)(filePath, projectRootMapping)) {
                filteredPaths[key] = files;
                break;
            }
        }
    }
    return JSON.stringify({
        compilerOptions: Object.assign(Object.assign({}, compilerOptions), { paths: filteredPaths }),
    });
}
