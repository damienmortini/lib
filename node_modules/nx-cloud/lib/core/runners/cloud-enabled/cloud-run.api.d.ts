import { RunContext } from '../../models/run-context.model';
import { MachineInfo } from '../../models/machine-info.model';
import { CacheUrls } from '../../models/cache-urls.model';
import { CloudTaskRunnerOptions } from '../../models/cloud-task-runner-options';
import { RunData } from '../../models/run-data.model';
import { MessageReporter } from '../../terminal-output/message-reporter';
import { TaskExecution } from '../../models/task-execution.model';
export declare class CloudRunApi {
    private readonly messages;
    private readonly runContext;
    private readonly machineInfo;
    private apiAxiosInstance;
    constructor(messages: MessageReporter, runContext: RunContext, options: CloudTaskRunnerOptions, machineInfo: MachineInfo);
    startRun(distributedExecutionId: string | undefined, hashes: string[]): Promise<CacheUrls>;
    private createReqBody;
    endRun(run: RunData, tasks: TaskExecution[], ciExecutionContext: {
        branch: string | null;
        runGroup: string | null;
        ciExecutionId: string | null;
        ciExecutionEnv: string | null;
    }, linkId?: string): Promise<boolean>;
    private nxCloudVersion;
}
