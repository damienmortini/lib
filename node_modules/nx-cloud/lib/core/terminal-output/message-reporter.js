"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageReporter = void 0;
const print_message_1 = require("../../utilities/print-message");
const { output } = require('../../utilities/nx-imports');
class MessageReporter {
    constructor(options) {
        this.options = options;
        this.cacheError = null;
        this.apiError = null;
        this.message = null;
    }
    get anyErrors() {
        return this.cacheError || this.apiError;
    }
    printMessages() {
        if (this.anyErrors) {
            const bodyLines = [];
            if (this.cacheError) {
                bodyLines.push(`- ${this.cacheError}`);
            }
            if (this.apiError && this.apiError !== this.cacheError) {
                bodyLines.push(`- ${this.apiError}`);
            }
            output.warn({
                title: `Nx Cloud Problems`,
                bodyLines,
            });
        }
        if (this.message) {
            (0, print_message_1.printMessage)(this.message);
        }
    }
    extractErrorMessage(e, scope) {
        if (e.code === 'ECONNABORTED') {
            return `Cannot connect to Nx Cloud (scope: ${scope}, code: ${e.code}). Try invoking the command with the NX_CLOUD_NO_TIMEOUTS env variable set to 'true'.`;
        }
        else if (e.code === 'ECONNREFUSED' ||
            e.code === 'EAI_AGAIN' ||
            e.code === 'ENOTFOUND' ||
            e.code === 'EPROTO') {
            return `Cannot connect to Nx Cloud (scope: ${scope}, code: ${e.code}).`;
        }
        else if (e.response && e.response.status === 401) {
            return e.response.data.message
                ? e.response.data.message
                : e.response.data;
        }
        else if (e.response && e.response.status === 402) {
            if (this.options.showUsageWarnings === false ||
                this.options.showUsageWarnings === undefined)
                return null;
            return e.response.data.message
                ? e.response.data.message
                : e.response.data;
        }
        else {
            let details = '';
            if (e.response && e.response.data && e.response.data.message) {
                details = `. ${e.response.data.message}`;
            }
            else if (e.response && e.response.data) {
                details = `. ${e.response.data}`;
            }
            const code = e.code ? ` (code: ${e.code})` : ``;
            return `${e.message}${details}${code}`;
        }
    }
}
exports.MessageReporter = MessageReporter;
//# sourceMappingURL=message-reporter.js.map