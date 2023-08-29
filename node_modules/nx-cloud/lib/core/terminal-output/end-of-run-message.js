"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndOfRunMessage = void 0;
const environment_1 = require("../../utilities/environment");
const print_message_1 = require("../../utilities/print-message");
class EndOfRunMessage {
    constructor(runContext, taskExecutions, distributedExecutionId) {
        this.runContext = runContext;
        this.taskExecutions = taskExecutions;
        this.distributedExecutionId = distributedExecutionId;
    }
    printCacheHitsMessage() {
        if ((0, environment_1.agentRunningInDistributedExecution)(this.distributedExecutionId))
            return;
        if (!this.runContext.runUrl) {
            return;
        }
        const anyErrors = !!this.taskExecutions.find((te) => te.status !== 0);
        const anyCacheMisses = !!this.taskExecutions.find((te) => te.cacheStatus === 'cache-miss');
        const hits = this.taskExecutions
            .filter((t) => this.runContext.statuses[t.hash] === 'remote-cache-hit')
            .map((t) => t.projectName);
        const message = [];
        if (anyErrors) {
            message.push(`View structured, searchable error logs at ${this.runContext.runUrl}`);
        }
        else if (anyCacheMisses) {
            message.push(`View logs and investigate cache misses at ${this.runContext.runUrl}`);
        }
        else if (hits.length > 0) {
            const tasks = hits.length === 1 ? hits[0] : `${hits.length} tasks`;
            message.push(`Nx Cloud made it possible to reuse ${tasks}: ${this.runContext.runUrl}`);
        }
        else {
            if (this.runContext.runUrl) {
                message.push(`View logs and run details at ${this.runContext.runUrl}`);
            }
        }
        if (message.length > 0) {
            (0, print_message_1.printMessage)(message.join(' '));
        }
    }
}
exports.EndOfRunMessage = EndOfRunMessage;
//# sourceMappingURL=end-of-run-message.js.map