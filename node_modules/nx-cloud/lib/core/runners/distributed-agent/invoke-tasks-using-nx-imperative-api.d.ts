import { CloudTaskRunnerOptions } from '../../models/cloud-task-runner-options';
import { TaskToExecute } from '../../models/distributed-agent';
export declare function invokeTasksUsingNxImperativeApi(options: CloudTaskRunnerOptions): Promise<(executionId: string, tasksToExecute: TaskToExecute[], parallel: number) => Promise<{
    completedTasks: {
        taskId: string;
        hash: string;
    }[];
    completedStatusCode: number;
}>>;
