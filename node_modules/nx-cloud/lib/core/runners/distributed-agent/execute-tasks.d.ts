import { DistributedAgentApi } from './distributed-agent.api';
import { TaskToExecute } from '../../models/distributed-agent';
import { DteArtifactStorage } from '../../../utilities/dte-artifact-storage';
export declare function executeTasks(agentName: string, api: DistributedAgentApi, dteArtifactStorage: DteArtifactStorage, invokeTasks: (executionId: string, tasks: TaskToExecute[], maxParallel: number) => Promise<{
    completedTasks: {
        taskId: string;
        hash: string;
    }[];
    completedStatusCode: number;
}>, targets: string[]): Promise<void>;
