import { PropertyType, mat4, vec3, vec4, Nullable } from '../constants.js';
import type { Camera } from './camera.js';
import { ExtensibleProperty, IExtensibleProperty } from './extensible-property.js';
import type { Mesh } from './mesh.js';
import type { Skin } from './skin.js';
interface INode extends IExtensibleProperty {
    translation: vec3;
    rotation: vec4;
    scale: vec3;
    weights: number[];
    camera: Camera;
    mesh: Mesh;
    skin: Skin;
    children: Node[];
}
/**
 * *Nodes are the objects that comprise a {@link Scene}.*
 *
 * Each Node may have one or more children, and a transform (position, rotation, and scale) that
 * applies to all of its descendants. A Node may also reference (or "instantiate") other resources
 * at its location, including {@link Mesh}, Camera, Light, and Skin properties. A Node cannot be
 * part of more than one {@link Scene}.
 *
 * A Node's local transform is represented with array-like objects, intended to be compatible with
 * [gl-matrix](https://github.com/toji/gl-matrix), or with the `toArray`/`fromArray` methods of
 * libraries like three.js and babylon.js.
 *
 * Usage:
 *
 * ```ts
 * const node = doc.createNode('myNode')
 * 	.setMesh(mesh)
 * 	.setTranslation([0, 0, 0])
 * 	.addChild(otherNode);
 * ```
 *
 * References:
 * - [glTF → Nodes and Hierarchy](https://github.com/KhronosGroup/gltf/blob/main/specification/2.0/README.md#nodes-and-hierarchy)
 *
 * @category Properties
 */
export declare class Node extends ExtensibleProperty<INode> {
    propertyType: PropertyType.NODE;
    protected init(): void;
    protected getDefaults(): Nullable<INode>;
    copy(other: this, resolve?: <T extends import("./property.js").Property<import("./property.js").IProperty>>(t: T) => T): this;
    /**********************************************************************************************
     * Local transform.
     */
    /** Returns the translation (position) of this Node in local space. */
    getTranslation(): vec3;
    /** Returns the rotation (quaternion) of this Node in local space. */
    getRotation(): vec4;
    /** Returns the scale of this Node in local space. */
    getScale(): vec3;
    /** Sets the translation (position) of this Node in local space. */
    setTranslation(translation: vec3): this;
    /** Sets the rotation (quaternion) of this Node in local space. */
    setRotation(rotation: vec4): this;
    /** Sets the scale of this Node in local space. */
    setScale(scale: vec3): this;
    /** Returns the local matrix of this Node. */
    getMatrix(): mat4;
    /** Sets the local matrix of this Node. Matrix will be decomposed to TRS properties. */
    setMatrix(matrix: mat4): this;
    /**********************************************************************************************
     * World transform.
     */
    /** Returns the translation (position) of this Node in world space. */
    getWorldTranslation(): vec3;
    /** Returns the rotation (quaternion) of this Node in world space. */
    getWorldRotation(): vec4;
    /** Returns the scale of this Node in world space. */
    getWorldScale(): vec3;
    /** Returns the world matrix of this Node. */
    getWorldMatrix(): mat4;
    /**********************************************************************************************
     * Scene hierarchy.
     */
    /**
     * Adds the given Node as a child of this Node.
     *
     * Requirements:
     *
     * 1. Nodes MAY be root children of multiple {@link Scene Scenes}
     * 2. Nodes MUST NOT be children of >1 Node
     * 3. Nodes MUST NOT be children of both Nodes and {@link Scene Scenes}
     *
     * The `addChild` method enforces these restrictions automatically, and will
     * remove the new child from previous parents where needed. This behavior
     * may change in future major releases of the library.
     *
     * @privateRemarks Requires non-graph state.
     */
    addChild(child: Node): this;
    /** Removes a Node from this Node's child Node list. */
    removeChild(child: Node): this;
    /** Lists all child Nodes of this Node. */
    listChildren(): Node[];
    /** @deprecated Use {@link Node.getParentNode} and {@link listNodeScenes} instead. */
    getParent(): SceneNode | null;
    /**
     * Returns the Node's unique parent Node within the scene graph. If the
     * Node has no parents, or is a direct child of the {@link Scene}
     * ("root node"), this method returns null.
     *
     * Unrelated to {@link Property.listParents}, which lists all resource
     * references from properties of any type ({@link Skin}, {@link Root}, ...).
     */
    getParentNode(): Node | null;
    /**********************************************************************************************
     * Attachments.
     */
    /** Returns the {@link Mesh}, if any, instantiated at this Node. */
    getMesh(): Mesh | null;
    /**
     * Sets a {@link Mesh} to be instantiated at this Node. A single mesh may be instatiated by
     * multiple Nodes; reuse of this sort is strongly encouraged.
     */
    setMesh(mesh: Mesh | null): this;
    /** Returns the {@link Camera}, if any, instantiated at this Node. */
    getCamera(): Camera | null;
    /** Sets a {@link Camera} to be instantiated at this Node. */
    setCamera(camera: Camera | null): this;
    /** Returns the {@link Skin}, if any, instantiated at this Node. */
    getSkin(): Skin | null;
    /** Sets a {@link Skin} to be instantiated at this Node. */
    setSkin(skin: Skin | null): this;
    /**
     * Initial weights of each {@link PrimitiveTarget} for the mesh instance at this Node.
     * Most engines only support 4-8 active morph targets at a time.
     */
    getWeights(): number[];
    /**
     * Initial weights of each {@link PrimitiveTarget} for the mesh instance at this Node.
     * Most engines only support 4-8 active morph targets at a time.
     */
    setWeights(weights: number[]): this;
    /**********************************************************************************************
     * Helpers.
     */
    /** Visits this {@link Node} and its descendants, top-down. */
    traverse(fn: (node: Node) => void): this;
}
interface SceneNode {
    propertyType: PropertyType;
    _parent?: SceneNode | null;
    addChild(node: Node): this;
    removeChild(node: Node): this;
}
export {};
