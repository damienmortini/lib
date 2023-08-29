import { CloudTaskRunnerOptions } from '../../models/cloud-task-runner-options';
import { Task } from '../../models/run-context.model';
export declare class DistributedExecutionApi {
    private apiAxiosInstance;
    constructor(options: CloudTaskRunnerOptions);
    start(params: any): Promise<string>;
    status(id: string): Promise<any>;
    completeRunGroupWithError(branch: string | null, runGroup: string | null, ciExecutionId: string | null, ciExecutionEnv: string, error: string | null): Promise<void>;
}
export declare function createStartRequest(branch: string | null, runGroup: string, ciExecutionId: string | null, ciExecutionEnv: string, task: Task[][], options: CloudTaskRunnerOptions, commitSha?: string): any;
