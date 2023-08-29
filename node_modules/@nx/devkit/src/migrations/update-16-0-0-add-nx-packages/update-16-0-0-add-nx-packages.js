"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const format_files_1 = require("../../generators/format-files");
const replace_package_1 = require("../../utils/replace-package");
function replacePackage(tree) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield (0, replace_package_1.replaceNrwlPackageWithNxPackage)(tree, '@nrwl/devkit', '@nx/devkit');
        yield (0, format_files_1.formatFiles)(tree);
    });
}
exports.default = replacePackage;
