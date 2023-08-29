import { Task } from '../../models/run-context.model';
import { DteArtifactStorage } from '../../../utilities/dte-artifact-storage';
export declare function processTask(dteArtifactStorage: DteArtifactStorage, tasks: Task[], completedTask: {
    taskId: string;
    hash: string;
    url: string;
}): Promise<void>;
