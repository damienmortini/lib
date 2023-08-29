"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUnchangedValueTimeout = void 0;
const { output } = require('./nx-imports');
function createUnchangedValueTimeout(options) {
    let value = new Object();
    let valueIsSetAt;
    return (newValue) => {
        if (value !== newValue) {
            value = newValue;
            valueIsSetAt = new Date();
        }
        else {
            if (new Date().getTime() - valueIsSetAt.getTime() > options.timeout) {
                output.error({
                    title: options.title,
                });
                process.exit(1);
            }
        }
    };
}
exports.createUnchangedValueTimeout = createUnchangedValueTimeout;
//# sourceMappingURL=create-unchanged-value-timeout.js.map