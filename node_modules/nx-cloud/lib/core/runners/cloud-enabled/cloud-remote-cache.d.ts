import { CloudRunApi } from './cloud-run.api';
import { RunContext } from '../../models/run-context.model';
import { FileStorage } from '../../file-storage/file-storage';
import { MessageReporter } from '../../terminal-output/message-reporter';
export declare class CloudRemoteCache {
    private readonly messages;
    private readonly api;
    private readonly runContext;
    private readonly fileStorage;
    private readonly distributedExecutionId;
    private readonly storeInCurrentProcess;
    private readonly storeRequests;
    delayedStoreRequests: {
        hash: string;
        url: string;
    }[];
    constructor(messages: MessageReporter, api: CloudRunApi, runContext: RunContext, fileStorage: FileStorage, distributedExecutionId: string | undefined, storeInCurrentProcess: boolean);
    retrieve(hash: string, cacheDirectory: string): Promise<boolean>;
    store(hash: string, cacheDirectory: string): Promise<boolean>;
    private hashUrls;
    waitForStoreRequestsToComplete(): Promise<void>;
}
