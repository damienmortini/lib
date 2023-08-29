export interface TaskToExecute {
    taskId: string;
    projectName: string;
    target: string;
    configuration: string | null;
    params: string;
}
