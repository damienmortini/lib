import { CloudTaskRunnerOptions } from '../models/cloud-task-runner-options';
export declare class MessageReporter {
    private readonly options;
    cacheError: string | null;
    apiError: string | null;
    message: string | null;
    constructor(options: CloudTaskRunnerOptions);
    get anyErrors(): string | null;
    printMessages(): void;
    extractErrorMessage(e: any, scope: string): string | null;
}
