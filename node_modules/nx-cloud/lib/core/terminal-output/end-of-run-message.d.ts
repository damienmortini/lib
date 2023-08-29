import { RunContext } from '../models/run-context.model';
import { TaskExecution } from '../models/task-execution.model';
export declare class EndOfRunMessage {
    private readonly runContext;
    private readonly taskExecutions;
    private readonly distributedExecutionId;
    constructor(runContext: RunContext, taskExecutions: TaskExecution[], distributedExecutionId: string | undefined);
    printCacheHitsMessage(): void;
}
