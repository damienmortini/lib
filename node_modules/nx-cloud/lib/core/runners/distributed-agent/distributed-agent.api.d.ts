import { CloudTaskRunnerOptions } from '../../models/cloud-task-runner-options';
import { TasksApiResponse } from '../../models/distributed-agent';
export declare class DistributedAgentApi {
    private readonly branch;
    private readonly runGroup;
    private readonly ciExecutionId;
    private readonly ciExecutionEnv;
    private readonly agentName;
    private apiAxiosInstance;
    constructor(options: CloudTaskRunnerOptions, branch: string | null, runGroup: string, ciExecutionId: string | null, ciExecutionEnv: string, agentName: string);
    tasks(executionId: string | null, statusCode: number | null, completedTasks: {
        taskId: string;
        hash: string;
    }[], targets?: string[]): Promise<TasksApiResponse>;
    completeRunGroupWithError(error: string): Promise<void>;
}
