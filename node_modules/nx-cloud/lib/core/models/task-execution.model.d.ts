export interface TaskExecution {
    taskId: string;
    target: string;
    projectName: string;
    hash: string;
    startTime: string;
    endTime: string;
    hashDetails: any;
    params: string;
    cacheStatus: 'remote-cache-hit' | 'local-cache-hit' | 'cache-miss';
    status: number;
    uploadedToStorage: boolean;
    terminalOutput?: string;
}
