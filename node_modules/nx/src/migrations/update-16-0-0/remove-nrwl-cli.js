"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const format_changed_files_with_prettier_if_available_1 = require("../../generators/internal-utils/format-changed-files-with-prettier-if-available");
const json_1 = require("../../generators/utils/json");
function default_1(tree) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        (0, json_1.updateJson)(tree, 'package.json', (json) => {
            for (const deps of [json.dependencies, json.devDependencies]) {
                if (deps) {
                    delete deps['@nrwl/cli'];
                }
            }
            return json;
        });
        yield (0, format_changed_files_with_prettier_if_available_1.formatChangedFilesWithPrettierIfAvailable)(tree);
    });
}
exports.default = default_1;
