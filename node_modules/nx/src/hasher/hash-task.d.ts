import { Task, TaskGraph } from '../config/task-graph';
import { TaskHasher } from './task-hasher';
import { ProjectGraph } from '../config/project-graph';
import { Workspaces } from '../config/workspaces';
import { NxJsonConfiguration } from '../config/nx-json';
export declare function hashTasksThatDoNotDependOnOutputsOfOtherTasks(workspaces: Workspaces, hasher: TaskHasher, projectGraph: ProjectGraph, taskGraph: TaskGraph, nxJson: NxJsonConfiguration): Promise<void>;
export declare function hashTask(workspaces: Workspaces, hasher: TaskHasher, projectGraph: ProjectGraph, taskGraph: TaskGraph, task: Task): Promise<void>;
