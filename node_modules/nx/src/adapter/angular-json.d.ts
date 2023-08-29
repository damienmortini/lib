import { ProjectConfiguration, ProjectsConfigurations } from '../config/workspace-json-project-json';
export declare function shouldMergeAngularProjects(root: string, includeProjectsFromAngularJson: boolean): boolean;
export declare function isAngularPluginInstalled(): boolean;
export declare function mergeAngularJsonAndProjects(projects: {
    [name: string]: ProjectConfiguration;
}, angularCliWorkspaceRoot: string): {
    [name: string]: ProjectConfiguration;
};
export declare function toNewFormat(w: any): ProjectsConfigurations;
export declare function toOldFormat(w: any): any;
