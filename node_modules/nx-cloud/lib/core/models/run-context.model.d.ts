import { CacheUrls } from './cache-urls.model';
export type TaskStatus = 'success' | 'failure' | 'skipped' | 'local-cache-kept-existing' | 'local-cache' | 'cache' | 'remote-cache';
export interface TaskResult {
    task: Task;
    status: TaskStatus;
    code: number;
    terminalOutput?: string;
    startTime?: number;
    endTime?: number;
}
export interface TaskGraph {
    roots: string[];
    tasks: Record<string, Task>;
    dependencies: Record<string, string[]>;
}
export interface ProjectGraph<T = any> {
    nodes: Record<string, ProjectGraphProjectNode<T>>;
    dependencies: Record<string, ProjectGraphDependency[]>;
}
/**
 * Type of dependency between projects
 */
export declare enum DependencyType {
    /**
     * Static dependencies are tied to the loading of the module
     */
    static = "static",
    /**
     * Dynamic dependencies are brought in by the module at run time
     */
    dynamic = "dynamic",
    /**
     * Implicit dependencies are inferred
     */
    implicit = "implicit"
}
/**
 * A node describing a project in a workspace
 */
export interface ProjectGraphProjectNode<T = any> {
    type: 'app' | 'e2e' | 'lib';
    name: string;
    /**
     * Additional metadata about a project
     */
    data: T & {
        /**
         * The project's root directory
         */
        root: string;
        sourceRoot?: string;
        /**
         * Targets associated to the project
         */
        targets?: {
            [targetName: string]: any;
        };
        /**
         * Project's tags used for enforcing module boundaries
         */
        tags?: string[];
        /**
         * Projects on which this node implicitly depends on
         */
        implicitDependencies?: string[];
        /**
         * Files associated to the project
         */
        files: any[];
    };
}
/**
 * A node describing an external dependency
 */
export interface ProjectGraphExternalNode {
    type: 'npm';
    name: `npm:${string}`;
    data: {
        version: string;
        packageName: string;
    };
}
/**
 * A dependency between two projects
 */
export interface ProjectGraphDependency {
    type: DependencyType | string;
    /**
     * The project being imported by the other
     */
    target: string;
    /**
     * The project importing the other
     */
    source: string;
}
export interface Task {
    id: string;
    target: {
        project: string;
        target: string;
        configuration?: string;
    };
    overrides: any;
    projectRoot?: string;
    hash?: string;
    hashDetails?: {
        command: string;
        nodes: {
            [name: string]: string;
        };
        implicitDeps: {
            [fileName: string]: string;
        };
        runtime: {
            [input: string]: string;
        };
    };
}
export type RunContext = {
    statuses: {
        [hash: string]: 'remote-cache-hit' | 'cache-miss';
    };
    runUrl?: string;
    allTasks: Task[];
    scheduledTasks: Task[];
    requests: {
        [hash: string]: Promise<CacheUrls>;
    };
};
