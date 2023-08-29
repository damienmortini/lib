#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clean_up_agents_1 = require("../lib/core/commands/clean-up-agents");
const record_output_1 = require("../lib/core/commands/record-output");
const start_ci_run_1 = require("../lib/core/commands/start-ci-run");
const stop_all_agents_1 = require("../lib/core/commands/stop-all-agents");
const distributed_agent_impl_1 = require("../lib/core/runners/distributed-agent/distributed-agent.impl");
const upload_and_show_run_details_1 = require("../lib/core/commands/upload-and-show-run-details");
const command = process.argv[2];
if (command === 'start-agent') {
    (0, distributed_agent_impl_1.startAgent)().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
else if (command === 'stop-all-agents') {
    (0, stop_all_agents_1.stopAllAgents)().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
else if (command === 'start-ci-run') {
    (0, start_ci_run_1.startCiRun)().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
else if (command === 'clean-up-agents') {
    (0, clean_up_agents_1.cleanUpAgents)().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
else if (command === 'record') {
    (0, record_output_1.runCommandAndStoreInCloud)().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
else if (command === 'upload-and-show-run-details') {
    (0, upload_and_show_run_details_1.uploadAndShowRunDetails)().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
else {
    console.log('Pass start-agent, stop-all-agents, or clean-up-agents');
}
//# sourceMappingURL=nx-cloud.js.map