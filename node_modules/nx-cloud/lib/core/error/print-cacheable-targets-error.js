"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printCacheableTargetsError = void 0;
const { output } = require('../../utilities/nx-imports');
function printCacheableTargetsError(wrongTargets) {
    output.error({
        title: `Targets Must Be Cacheable Operations.`,
        bodyLines: [
            `- Found non-cacheable operation(s): ${wrongTargets.join(', ')}`,
            `- Cacheable operations are defined in your nx.json file.`,
        ],
    });
}
exports.printCacheableTargetsError = printCacheableTargetsError;
//# sourceMappingURL=print-cacheable-targets-error.js.map