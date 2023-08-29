import { CloudTaskRunnerOptions } from '../models/cloud-task-runner-options';
import { E2EEncryption } from './e2e-encryption';
import { ErrorReporterApi } from '../api/error-reporter.api';
import { AxiosRequestConfig } from 'axios';
export declare class FileStorage {
    private readonly encryption;
    private readonly errorReporter;
    private readonly context;
    storedHashes: string[];
    axiosConfigBuilder: (axiosConfig: AxiosRequestConfig) => AxiosRequestConfig;
    constructor(encryption: E2EEncryption, errorReporter: ErrorReporterApi, options: CloudTaskRunnerOptions, context: string);
    retrieve(hash: string, url: string, cacheDirectory: string): Promise<void>;
    store(hash: string, url: string, cacheDirectory: string): Promise<any>;
    private createFileName;
    private downloadFile;
    private convertStreamIntoPromise;
    private createCommitFile;
    private createCommitFilePath;
    private createFile;
    private uploadFile;
    private generateMD5;
    private getFileUploadHeaders;
}
