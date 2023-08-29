export interface RunData {
    command: string;
    startTime: string;
    endTime: string;
    distributedExecutionId?: string;
    branch: string | null;
    runGroup?: string;
    sha?: string;
    inner: boolean;
}
