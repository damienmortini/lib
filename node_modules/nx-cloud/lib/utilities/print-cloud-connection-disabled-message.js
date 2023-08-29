"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printCloudConnectionDisabledMessage = void 0;
function printCloudConnectionDisabledMessage() {
    const { output } = require('./nx-imports');
    output.error({
        title: `Connections to Nx Cloud are disabled for this workspace`,
        bodyLines: [
            `This was an intentional decision by someone on your team.`,
            `Nx Cloud cannot and will not be enabled.`,
            ``,
            `To allow connections to Nx Cloud again, remove the 'neverConnectToCloud'`,
            `property in nx.json.`,
        ],
    });
}
exports.printCloudConnectionDisabledMessage = printCloudConnectionDisabledMessage;
//# sourceMappingURL=print-cloud-connection-disabled-message.js.map