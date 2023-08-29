import { TaskToExecute } from '../../models/distributed-agent';
export declare function invokeTasksUsingRunMany(): Promise<(executionId: string, tasksToExecute: TaskToExecute[], parallel: number) => Promise<{
    completedTasks: {
        taskId: string;
        hash: string;
    }[];
    completedStatusCode: number;
}>>;
