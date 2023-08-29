import { FileData } from './file-utils';
import { ProjectFileMapCache } from './nx-deps-cache';
import { ProjectFileMap, ProjectGraph } from '../config/project-graph';
import { ProjectsConfigurations } from '../config/workspace-json-project-json';
export declare function getProjectFileMap(): {
    projectFileMap: ProjectFileMap;
    allWorkspaceFiles: FileData[];
};
export declare function buildProjectGraphUsingProjectFileMap(projectsConfigurations: ProjectsConfigurations, projectFileMap: ProjectFileMap, allWorkspaceFiles: FileData[], fileMap: ProjectFileMapCache | null, shouldWriteCache: boolean): Promise<{
    projectGraph: ProjectGraph;
    projectFileMapCache: ProjectFileMapCache;
}>;
