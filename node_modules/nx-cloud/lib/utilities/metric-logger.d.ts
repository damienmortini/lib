import { CloudTaskRunnerOptions } from '../core/models/cloud-task-runner-options';
export interface NxCloudPerfEntry {
    durationMs?: number;
    entryType: string;
    success: boolean;
    statusCode: number;
    payloadSize: number;
}
export interface MetricRecorder {
    recordMetric: (metadata: Partial<NxCloudPerfEntry>) => void;
}
export declare const createMetricRecorder: (entryType: string) => MetricRecorder;
/**
 * Handles creating metadata for metrics that only need an NxCloudPerfEntry
 * @param resp response from nx-api
 */
export declare const mapRespToPerfEntry: (resp: any) => Partial<NxCloudPerfEntry>;
/**
 * Constant to represent metrics when something goes wrong on the runner side
 */
export declare const RUNNER_FAILURE_PERF_ENTRY: Partial<NxCloudPerfEntry>;
export declare const submitRunMetrics: (options: CloudTaskRunnerOptions) => any;
