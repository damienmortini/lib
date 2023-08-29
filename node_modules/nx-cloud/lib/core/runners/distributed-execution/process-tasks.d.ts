import { DistributedExecutionApi } from './distributed-execution.api';
import { Task } from '../../models/run-context.model';
import { DteArtifactStorage } from '../../../utilities/dte-artifact-storage';
export declare function processTasks(api: DistributedExecutionApi, dteArtifactStorage: DteArtifactStorage, executionId: string, tasks: Task[]): Promise<{
    commandStatus: any;
    runUrl: any;
}>;
