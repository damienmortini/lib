import { CloudTaskRunnerOptions } from '../core/models/cloud-task-runner-options';
export declare class AxiosException {
    readonly type: 'timeout' | 'failure';
    readonly message: string;
    readonly axiosException: any;
    constructor(type: 'timeout' | 'failure', message: string, axiosException: any);
}
export declare function createApiAxiosInstance(options: CloudTaskRunnerOptions): any;
export declare function printDuration(description: string, callback: Function): Promise<any>;
export declare function axiosMultipleTries(axiosCallCreator: () => Promise<any>, retriesLeft?: number): Promise<any>;
