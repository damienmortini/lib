"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectGraphBuilder = void 0;
/**
 * Builder for adding nodes and dependencies to a {@link ProjectGraph}
 */
const project_graph_1 = require("../config/project-graph");
const build_project_graph_1 = require("./build-project-graph");
class ProjectGraphBuilder {
    constructor(g, fileMap) {
        this.removedEdges = {};
        if (g) {
            this.graph = g;
            this.fileMap = fileMap || (0, build_project_graph_1.getProjectFileMap)().projectFileMap;
        }
        else {
            this.graph = {
                nodes: {},
                externalNodes: {},
                dependencies: {},
            };
            this.fileMap = fileMap || {};
        }
    }
    /**
     * Merges the nodes and dependencies of p into the built project graph.
     */
    mergeProjectGraph(p) {
        this.graph.nodes = Object.assign(Object.assign({}, this.graph.nodes), p.nodes);
        this.graph.externalNodes = Object.assign(Object.assign({}, this.graph.externalNodes), p.externalNodes);
        this.graph.dependencies = Object.assign(Object.assign({}, this.graph.dependencies), p.dependencies);
    }
    /**
     * Adds a project node to the project graph
     */
    addNode(node) {
        // Check if project with the same name already exists
        if (this.graph.nodes[node.name]) {
            // Throw if existing project is of a different type
            if (this.graph.nodes[node.name].type !== node.type) {
                throw new Error(`Multiple projects are named "${node.name}". One is of type "${node.type}" and the other is of type "${this.graph.nodes[node.name].type}". Please resolve the conflicting project names.`);
            }
        }
        this.graph.nodes[node.name] = node;
    }
    /**
     * Removes a node and all of its dependency edges from the graph
     */
    removeNode(name) {
        if (!this.graph.nodes[name] && !this.graph.externalNodes[name]) {
            throw new Error(`There is no node named: "${name}"`);
        }
        this.removeDependenciesWithNode(name);
        if (this.graph.nodes[name]) {
            delete this.graph.nodes[name];
        }
        else {
            delete this.graph.externalNodes[name];
        }
    }
    /**
     * Adds a external node to the project graph
     */
    addExternalNode(node) {
        // Check if project with the same name already exists
        if (this.graph.externalNodes[node.name]) {
            throw new Error(`Multiple projects are named "${node.name}". One has version "${node.data.version}" and the other has version "${this.graph.externalNodes[node.name].data.version}". Please resolve the conflicting package names.`);
        }
        this.graph.externalNodes[node.name] = node;
    }
    /**
     * Adds static dependency from source project to target project
     */
    addStaticDependency(sourceProjectName, targetProjectName, sourceProjectFile) {
        // internal nodes must provide sourceProjectFile when creating static dependency
        // externalNodes do not have sourceProjectFile
        if (this.graph.nodes[sourceProjectName] && !sourceProjectFile) {
            throw new Error(`Source project file is required`);
        }
        this.addDependency(sourceProjectName, targetProjectName, project_graph_1.DependencyType.static, sourceProjectFile);
    }
    /**
     * Adds dynamic dependency from source project to target project
     */
    addDynamicDependency(sourceProjectName, targetProjectName, sourceProjectFile) {
        if (this.graph.externalNodes[sourceProjectName]) {
            throw new Error(`External projects can't have "dynamic" dependencies`);
        }
        // dynamic dependency is always bound to a file
        if (!sourceProjectFile) {
            throw new Error(`Source project file is required`);
        }
        this.addDependency(sourceProjectName, targetProjectName, project_graph_1.DependencyType.dynamic, sourceProjectFile);
    }
    /**
     * Adds implicit dependency from source project to target project
     */
    addImplicitDependency(sourceProjectName, targetProjectName) {
        if (this.graph.externalNodes[sourceProjectName]) {
            throw new Error(`External projects can't have "implicit" dependencies`);
        }
        this.addDependency(sourceProjectName, targetProjectName, project_graph_1.DependencyType.implicit);
    }
    /**
     * Removes a dependency from source project to target project
     */
    removeDependency(sourceProjectName, targetProjectName) {
        if (sourceProjectName === targetProjectName) {
            return;
        }
        if (!this.graph.nodes[sourceProjectName]) {
            throw new Error(`Source project does not exist: ${sourceProjectName}`);
        }
        if (!this.graph.nodes[targetProjectName] &&
            !this.graph.externalNodes[targetProjectName]) {
            throw new Error(`Target project does not exist: ${targetProjectName}`);
        }
        // this.graph.dependencies[sourceProjectName] = this.graph.dependencies[
        //   sourceProjectName
        // ].filter((d) => d.target !== targetProjectName);
        if (!this.removedEdges[sourceProjectName]) {
            this.removedEdges[sourceProjectName] = new Set();
        }
        this.removedEdges[sourceProjectName].add(targetProjectName);
    }
    /**
     * Add an explicit dependency from a file in source project to target project
     * @deprecated this method will be removed in v17. Use {@link addStaticDependency} or {@link addDynamicDependency} instead
     */
    addExplicitDependency(sourceProjectName, sourceProjectFile, targetProjectName) {
        this.addStaticDependency(sourceProjectName, targetProjectName, sourceProjectFile);
    }
    /**
     * Set version of the project graph
     */
    setVersion(version) {
        this.graph.version = version;
    }
    getUpdatedProjectGraph() {
        for (const sourceProject of Object.keys(this.graph.nodes)) {
            const alreadySetTargetProjects = this.calculateAlreadySetTargetDeps(sourceProject);
            this.graph.dependencies[sourceProject] = [
                ...alreadySetTargetProjects.values(),
            ].flatMap((depsMap) => [...depsMap.values()]);
            const fileDeps = this.calculateTargetDepsFromFiles(sourceProject);
            for (const [targetProject, types] of fileDeps.entries()) {
                // only add known nodes
                if (!this.graph.nodes[targetProject] &&
                    !this.graph.externalNodes[targetProject]) {
                    continue;
                }
                for (const type of types.values()) {
                    if (!alreadySetTargetProjects.has(targetProject) ||
                        !alreadySetTargetProjects.get(targetProject).has(type)) {
                        if (!this.removedEdges[sourceProject] ||
                            !this.removedEdges[sourceProject].has(targetProject)) {
                            this.graph.dependencies[sourceProject].push({
                                source: sourceProject,
                                target: targetProject,
                                type,
                            });
                        }
                    }
                }
            }
        }
        return this.graph;
    }
    addDependency(sourceProjectName, targetProjectName, type, sourceProjectFile) {
        if (sourceProjectName === targetProjectName) {
            return;
        }
        if (!this.graph.nodes[sourceProjectName] &&
            !this.graph.externalNodes[sourceProjectName]) {
            throw new Error(`Source project does not exist: ${sourceProjectName}`);
        }
        if (!this.graph.nodes[targetProjectName] &&
            !this.graph.externalNodes[targetProjectName] &&
            !sourceProjectFile) {
            throw new Error(`Target project does not exist: ${targetProjectName}`);
        }
        if (this.graph.externalNodes[sourceProjectName] &&
            this.graph.nodes[targetProjectName]) {
            throw new Error(`External projects can't depend on internal projects`);
        }
        if (!this.graph.dependencies[sourceProjectName]) {
            this.graph.dependencies[sourceProjectName] = [];
        }
        const isDuplicate = !!this.graph.dependencies[sourceProjectName].find((d) => d.target === targetProjectName && d.type === type);
        if (sourceProjectFile) {
            const source = this.graph.nodes[sourceProjectName];
            if (!source) {
                throw new Error(`Source project is not a project node: ${sourceProjectName}`);
            }
            const fileData = (this.fileMap[sourceProjectName] || []).find((f) => f.file === sourceProjectFile);
            if (!fileData) {
                throw new Error(`Source project ${sourceProjectName} does not have a file: ${sourceProjectFile}`);
            }
            if (!fileData.deps) {
                fileData.deps = [];
            }
            if (!fileData.deps.find((t) => (0, project_graph_1.fileDataDepTarget)(t) === targetProjectName &&
                (0, project_graph_1.fileDataDepType)(t) === type)) {
                const dep = type === 'static' ? targetProjectName : [targetProjectName, type];
                fileData.deps.push(dep);
            }
        }
        else if (!isDuplicate) {
            // only add to dependencies section if the source file is not specified
            // and not already added
            this.graph.dependencies[sourceProjectName].push({
                source: sourceProjectName,
                target: targetProjectName,
                type,
            });
        }
    }
    removeDependenciesWithNode(name) {
        // remove all source dependencies
        delete this.graph.dependencies[name];
        // remove all target dependencies
        for (const dependencies of Object.values(this.graph.dependencies)) {
            for (const [index, { source, target }] of dependencies.entries()) {
                if (target === name) {
                    const deps = this.graph.dependencies[source];
                    this.graph.dependencies[source] = [
                        ...deps.slice(0, index),
                        ...deps.slice(index + 1),
                    ];
                    if (this.graph.dependencies[source].length === 0) {
                        delete this.graph.dependencies[source];
                    }
                }
            }
        }
    }
    calculateTargetDepsFromFiles(sourceProject) {
        const fileDeps = new Map();
        const files = this.fileMap[sourceProject] || [];
        if (!files) {
            return fileDeps;
        }
        for (let f of files) {
            if (f.deps) {
                for (let d of f.deps) {
                    const target = (0, project_graph_1.fileDataDepTarget)(d);
                    if (!fileDeps.has(target)) {
                        fileDeps.set(target, new Set([(0, project_graph_1.fileDataDepType)(d)]));
                    }
                    else {
                        fileDeps.get(target).add((0, project_graph_1.fileDataDepType)(d));
                    }
                }
            }
        }
        return fileDeps;
    }
    calculateAlreadySetTargetDeps(sourceProject) {
        const alreadySetTargetProjects = new Map();
        if (this.graph.dependencies[sourceProject]) {
            const removed = this.removedEdges[sourceProject];
            for (const d of this.graph.dependencies[sourceProject]) {
                // static and dynamic dependencies of internal projects
                // will be rebuilt based on the file dependencies
                // we only need to keep the implicit dependencies
                if (d.type === project_graph_1.DependencyType.implicit && !(removed === null || removed === void 0 ? void 0 : removed.has(d.target))) {
                    if (!alreadySetTargetProjects.has(d.target)) {
                        alreadySetTargetProjects.set(d.target, new Map([[d.type, d]]));
                    }
                    else {
                        alreadySetTargetProjects.get(d.target).set(d.type, d);
                    }
                }
            }
        }
        return alreadySetTargetProjects;
    }
}
exports.ProjectGraphBuilder = ProjectGraphBuilder;
