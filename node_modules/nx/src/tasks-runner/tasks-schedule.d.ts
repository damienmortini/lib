import { Workspaces } from '../config/workspaces';
import { DefaultTasksRunnerOptions } from './default-tasks-runner';
import { TaskHasher } from '../hasher/task-hasher';
import { Task, TaskGraph } from '../config/task-graph';
import { ProjectGraph } from '../config/project-graph';
import { NxJsonConfiguration } from '../config/nx-json';
export interface Batch {
    executorName: string;
    taskGraph: TaskGraph;
}
export declare class TasksSchedule {
    private readonly hasher;
    private readonly nxJson;
    private readonly projectGraph;
    private readonly taskGraph;
    private readonly workspaces;
    private readonly options;
    private notScheduledTaskGraph;
    private reverseTaskDeps;
    private reverseProjectGraph;
    private scheduledBatches;
    private scheduledTasks;
    private completedTasks;
    private scheduleRequestsExecutionChain;
    constructor(hasher: TaskHasher, nxJson: NxJsonConfiguration, projectGraph: ProjectGraph, taskGraph: TaskGraph, workspaces: Workspaces, options: DefaultTasksRunnerOptions);
    scheduleNextTasks(): Promise<void>;
    hasTasks(): boolean;
    complete(taskIds: string[]): void;
    nextTask(): Task;
    nextBatch(): Batch;
    private scheduleTasks;
    private scheduleTask;
    private scheduleBatches;
    private scheduleBatch;
    private processTaskForBatches;
    private canBatchTaskBeScheduled;
    private canBeScheduled;
}
