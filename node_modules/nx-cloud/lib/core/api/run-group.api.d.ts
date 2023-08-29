import { CloudTaskRunnerOptions } from '../models/cloud-task-runner-options';
export declare class RunGroupApi {
    private apiAxiosInstance;
    constructor(options: CloudTaskRunnerOptions);
    createRunGroup(branch: string | null, runGroup: string, ciExecutionId: string | null, ciExecutionEnv: string, stopAgentsOnFailure?: boolean, agentCount?: number, stopAgentsAfter?: string, commitSha?: string, commitRef?: string): Promise<void>;
    completeRunGroup(branch: string | null, runGroup: string, ciExecutionId: string | null, ciExecutionEnv: string): Promise<void>;
}
