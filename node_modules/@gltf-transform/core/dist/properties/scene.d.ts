import { Nullable, PropertyType } from '../constants.js';
import { ExtensibleProperty, IExtensibleProperty } from './extensible-property.js';
import type { Node } from './node.js';
interface IScene extends IExtensibleProperty {
    children: Node[];
}
/**
 * *Scenes represent a set of visual objects to render.*
 *
 * Typically a glTF file contains only a single Scene, although more are allowed and useful in some
 * cases. No particular meaning is associated with additional Scenes, except as defined by the
 * application. Scenes reference {@link Node}s, and a single Node cannot be a member of more than
 * one Scene.
 *
 * References:
 * - [glTF → Scenes](https://github.com/KhronosGroup/gltf/blob/main/specification/2.0/README.md#scenes)
 * - [glTF → Coordinate System and Units](https://github.com/KhronosGroup/gltf/blob/main/specification/2.0/README.md#coordinate-system-and-units)
 *
 * @category Properties
 */
export declare class Scene extends ExtensibleProperty<IScene> {
    propertyType: PropertyType.SCENE;
    protected init(): void;
    protected getDefaults(): Nullable<IScene>;
    copy(other: this, resolve?: <T extends import("./property.js").Property<import("./property.js").IProperty>>(t: T) => T): this;
    /**
     * Adds a {@link Node} to the Scene.
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
    addChild(node: Node): this;
    /** Removes a {@link Node} from the Scene. */
    removeChild(node: Node): this;
    /**
     * Lists all direct child {@link Node Nodes} in the Scene. Indirect
     * descendants (children of children) are not returned, but may be
     * reached recursively or with {@link Scene.traverse} instead.
     */
    listChildren(): Node[];
    /** Visits each {@link Node} in the Scene, including descendants, top-down. */
    traverse(fn: (node: Node) => void): this;
}
export {};
