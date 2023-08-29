import { ProjectConfiguration, ProjectsConfigurations } from '../../config/workspace-json-project-json';
import { NxJsonConfiguration } from '../../config/nx-json';
import { FileData } from '../../config/project-graph';
/**
 * Walks the workspace directory to create the `projectFileMap`, `ProjectConfigurations` and `allWorkspaceFiles`
 * @throws
 * @param workspaceRoot
 * @param nxJson
 */
export declare function retrieveWorkspaceFiles(workspaceRoot: string, nxJson: NxJsonConfiguration): Promise<{
    allWorkspaceFiles: FileData[];
    projectFileMap: Record<string, import("../../native").FileData[]>;
    projectConfigurations: ProjectsConfigurations;
}>;
/**
 * Walk through the workspace and return `ProjectConfigurations`. Only use this if the projectFileMap is not needed.
 *
 * @param workspaceRoot
 * @param nxJson
 */
export declare function retrieveProjectConfigurations(workspaceRoot: string, nxJson: NxJsonConfiguration): Promise<Record<string, ProjectConfiguration>>;
