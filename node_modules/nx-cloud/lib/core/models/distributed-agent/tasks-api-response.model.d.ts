import { TaskToExecute } from './task-to-execute.model';
export interface TasksApiResponse {
    completed: boolean;
    status?: 'RUN_GROUP_COMPLETED' | 'NO_FURTHER_TASKS_TO_RUN' | 'IN_PROGRESS';
    retryDuring: number | null;
    executionId: string | null;
    completedTasks?: {
        taskId: string;
        hash: string;
        url: string;
    }[];
    tasks: TaskToExecute[];
    maxParallel: number;
    criticalErrorMessage: string | null;
}
