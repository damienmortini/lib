import { RunContext, Task, TaskResult } from '../../models/run-context.model';
import { TaskExecution } from '../../models/task-execution.model';
import { OutputObfuscator } from '../../terminal-output/output-obfuscator';
export declare class CloudEnabledLifeCycle {
    private readonly runContext;
    private readonly cacheDirectory;
    private readonly collectTerminalOutput;
    private readonly cacheableOperations;
    private readonly outputObfuscator;
    private readonly tasks;
    constructor(runContext: RunContext, cacheDirectory: string | undefined, collectTerminalOutput: boolean, cacheableOperations: string[], outputObfuscator: OutputObfuscator, tasks: TaskExecution[]);
    scheduleTask(task: Task): void;
    startTask(task: Task): void;
    endTasks(tasks: TaskResult[]): void;
    endCommand(): void;
    private updateStartedTask;
    private getTerminalOutput;
    private cleanUpHashDetails;
}
