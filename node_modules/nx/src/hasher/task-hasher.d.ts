import { FileData, ProjectFileMap, ProjectGraph, ProjectGraphProjectNode } from '../config/project-graph';
import { NxJsonConfiguration } from '../config/nx-json';
import { Task, TaskGraph } from '../config/task-graph';
import { InputDefinition } from '../config/workspace-json-project-json';
import { DaemonClient } from '../daemon/client/client';
import { FileHasher } from './file-hasher';
type ExpandedSelfInput = {
    fileset: string;
} | {
    runtime: string;
} | {
    env: string;
} | {
    externalDependencies: string[];
};
type ExpandedDepsOutput = {
    dependentTasksOutputFiles: string;
    transitive?: boolean;
};
type ExpandedInput = ExpandedSelfInput | ExpandedDepsOutput;
/**
 * A data structure returned by the default hasher.
 */
export interface PartialHash {
    value: string;
    details: {
        [name: string]: string;
    };
}
/**
 * A data structure returned by the default hasher.
 */
export interface Hash {
    value: string;
    details: {
        command: string;
        nodes: {
            [name: string]: string;
        };
        implicitDeps?: {
            [fileName: string]: string;
        };
        runtime?: {
            [input: string]: string;
        };
    };
}
export interface TaskHasher {
    hashTask(task: Task): Promise<Hash>;
    hashTasks(tasks: Task[]): Promise<Hash[]>;
}
export type Hasher = TaskHasher;
export declare class DaemonBasedTaskHasher implements TaskHasher {
    private readonly daemonClient;
    private readonly taskGraph;
    private readonly runnerOptions;
    constructor(daemonClient: DaemonClient, taskGraph: TaskGraph, runnerOptions: any);
    hashTasks(tasks: Task[]): Promise<Hash[]>;
    hashTask(task: Task): Promise<Hash>;
}
export declare class InProcessTaskHasher implements TaskHasher {
    private readonly projectFileMap;
    private readonly allWorkspaceFiles;
    private readonly projectGraph;
    private readonly taskGraph;
    private readonly nxJson;
    private readonly options;
    private readonly fileHasher;
    static version: string;
    private taskHasher;
    constructor(projectFileMap: ProjectFileMap, allWorkspaceFiles: FileData[], projectGraph: ProjectGraph, taskGraph: TaskGraph, nxJson: NxJsonConfiguration, options: any, fileHasher: FileHasher);
    hashTasks(tasks: Task[]): Promise<Hash[]>;
    hashTask(task: Task): Promise<Hash>;
    private hashCommand;
}
export declare function getNamedInputs(nxJson: NxJsonConfiguration, project: ProjectGraphProjectNode): {
    default: {
        fileset: string;
    }[];
};
export declare function getTargetInputs(nxJson: NxJsonConfiguration, projectNode: ProjectGraphProjectNode, target: string): {
    selfInputs: string[];
    dependencyInputs: string[];
};
export declare function extractPatternsFromFileSets(inputs: readonly ExpandedInput[]): string[];
export declare function getInputs(task: Task, projectGraph: ProjectGraph, nxJson: NxJsonConfiguration): {
    selfInputs: ExpandedSelfInput[];
    depsInputs: {
        input: string;
        dependencies: true;
    }[];
    depsOutputs: ExpandedDepsOutput[];
    projectInputs: {
        input: string;
        projects: string[];
    }[];
};
export declare function expandNamedInput(input: string, namedInputs: {
    [inputName: string]: ReadonlyArray<InputDefinition | string>;
}): ExpandedInput[];
export declare function filterUsingGlobPatterns(root: string, files: FileData[], patterns: string[]): FileData[];
export {};
