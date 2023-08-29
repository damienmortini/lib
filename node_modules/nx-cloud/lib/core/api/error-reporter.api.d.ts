import { CloudTaskRunnerOptions } from '../models/cloud-task-runner-options';
export declare class ErrorReporterApi {
    private apiAxiosInstance;
    constructor(options: CloudTaskRunnerOptions);
    reportError(message: string): Promise<void>;
}
