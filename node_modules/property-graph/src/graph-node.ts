/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { LiteralKeys, Nullable, Ref, RefMap, RefKeys, RefListKeys, RefMapKeys } from './constants.js';
import { BaseEvent, EventDispatcher, GraphNodeEvent } from './event-dispatcher.js';
import { Graph } from './graph.js';
import { GraphEdge } from './graph-edge.js';
import { isRef, isRefList, isRefMap } from './utils.js';

// References:
// - https://stackoverflow.com/a/70163679/1314762
// - https://stackoverflow.com/a/70201805/1314762

type GraphNodeAttributesInternal<Parent extends GraphNode, Attributes extends {}> = {
	[Key in keyof Attributes]: Attributes[Key] extends GraphNode
		? GraphEdge<Parent, Attributes[Key]>
		: Attributes[Key] extends GraphNode[]
		? GraphEdge<Parent, Attributes[Key][number]>[]
		: Attributes[Key] extends { [key: string]: GraphNode }
		? Record<string, GraphEdge<Parent, Attributes[Key][string]>>
		: Attributes[Key];
};

export const $attributes = Symbol('attributes');
export const $immutableKeys = Symbol('immutableKeys');

/**
 * Represents a node in a {@link Graph}.
 */
export abstract class GraphNode<Attributes extends {} = {}> extends EventDispatcher<GraphNodeEvent> {
	private _disposed = false;

	/**
	 * Internal graph used to search and maintain references.
	 * @hidden
	 */
	protected readonly graph: Graph<GraphNode>;

	/**
	 * Attributes (literal values and GraphNode references) associated with this instance. For each
	 * GraphNode reference, the attributes stores a {@link GraphEdge}. List and Map references are
	 * stored as arrays and dictionaries of edges.
	 * @internal
	 */
	protected readonly [$attributes]: GraphNodeAttributesInternal<this, Attributes>;

	/**
	 * Attributes included with `getDefaultAttributes` are considered immutable, and cannot be
	 * modifed by `.setRef()`, `.copy()`, or other GraphNode methods. Both the edges and the
	 * properties will be disposed with the parent GraphNode.
	 *
	 * Currently, only single-edge references (getRef/setRef) are supported as immutables.
	 *
	 * @internal
	 */
	protected readonly [$immutableKeys]: Set<string>;

	constructor(graph: Graph<GraphNode>) {
		super();
		this.graph = graph;
		this[$immutableKeys] = new Set();
		this[$attributes] = this._createAttributes();
	}

	/**
	 * Returns default attributes for the graph node. Subclasses having any attributes (either
	 * literal values or references to other graph nodes) must override this method. Literal
	 * attributes should be given their default values, if any. References should generally be
	 * initialized as empty (Ref → null, RefList → [], RefMap → {}) and then modified by setters.
	 *
	 * Any single-edge references (setRef) returned by this method will be considered immutable,
	 * to be owned by and disposed with the parent node. Multi-edge references (addRef, removeRef,
	 * setRefMap) cannot be returned as default attributes.
	 */
	protected getDefaults(): Nullable<Attributes> {
		return {} as Nullable<Attributes>;
	}

	/**
	 * Constructs and returns an object used to store a graph nodes attributes. Compared to the
	 * default Attributes interface, this has two distinctions:
	 *
	 * 1. Slots for GraphNode<T> objects are replaced with slots for GraphEdge<this, GraphNode<T>>
	 * 2. GraphNode<T> objects provided as defaults are considered immutable
	 *
	 * @internal
	 */
	private _createAttributes(): GraphNodeAttributesInternal<this, Attributes> {
		const defaultAttributes = this.getDefaults();
		const attributes = {} as GraphNodeAttributesInternal<this, Attributes>;
		for (const key in defaultAttributes) {
			const value = defaultAttributes[key] as any;
			if (value instanceof GraphNode) {
				const ref = this.graph.createEdge(key, this, value);
				ref.addEventListener('dispose', () => value.dispose());
				this[$immutableKeys].add(key);
				attributes[key] = ref as any;
			} else {
				attributes[key] = value as any;
			}
		}
		return attributes;
	}

	/** @internal Returns true if two nodes are on the same {@link Graph}. */
	public isOnGraph(other: GraphNode): boolean {
		return this.graph === other.graph;
	}

	/** Returns true if the node has been permanently removed from the graph. */
	public isDisposed(): boolean {
		return this._disposed;
	}

	/**
	 * Removes both inbound references to and outbound references from this object. At the end
	 * of the process the object holds no references, and nothing holds references to it. A
	 * disposed object is not reusable.
	 */
	public dispose(): void {
		if (this._disposed) return;
		this.graph.listChildEdges(this).forEach((edge) => edge.dispose());
		this.graph.disconnectParents(this);
		this._disposed = true;
		this.dispatchEvent({ type: 'dispose' });
	}

	/**
	 * Removes all inbound references to this object. At the end of the process the object is
	 * considered 'detached': it may hold references to child resources, but nothing holds
	 * references to it. A detached object may be re-attached.
	 */
	public detach(): this {
		this.graph.disconnectParents(this);
		return this;
	}

	/**
	 * Transfers this object's references from the old node to the new one. The old node is fully
	 * detached from this parent at the end of the process.
	 *
	 * @hidden
	 */
	public swap(old: GraphNode, replacement: GraphNode): this {
		for (const attribute in this[$attributes]) {
			const value = this[$attributes][attribute] as Ref | Ref[] | RefMap;
			if (isRef(value)) {
				const ref = value as Ref;
				if (ref.getChild() === old) {
					this.setRef(attribute as any, replacement, ref.getAttributes());
				}
			} else if (isRefList(value)) {
				const refs = value as Ref[];
				const ref = refs.find((ref) => ref.getChild() === old);
				if (ref) {
					const refAttributes = ref.getAttributes();
					this.removeRef(attribute as any, old).addRef(attribute as any, replacement, refAttributes);
				}
			} else if (isRefMap(value)) {
				const refMap = value as RefMap;
				for (const key in refMap) {
					const ref = refMap[key];
					if (ref.getChild() === old) {
						this.setRefMap(attribute as any, key, replacement, ref.getAttributes());
					}
				}
			}
		}
		return this;
	}

	/**********************************************************************************************
	 * Literal attributes.
	 */

	/** @hidden */
	protected get<K extends LiteralKeys<Attributes>>(attribute: K): Attributes[K] {
		return this[$attributes][attribute] as Attributes[K];
	}

	/** @hidden */
	protected set<K extends LiteralKeys<Attributes>>(attribute: K, value: Attributes[K]): this {
		(this[$attributes][attribute] as Attributes[K]) = value;
		return this.dispatchEvent({ type: 'change', attribute });
	}

	/**********************************************************************************************
	 * Ref: 1:1 graph node references.
	 */

	/** @hidden */
	protected getRef<K extends RefKeys<Attributes>>(attribute: K): (GraphNode & Attributes[K]) | null {
		const ref = this[$attributes][attribute] as Ref;
		return ref ? (ref.getChild() as GraphNode & Attributes[K]) : null;
	}

	/** @hidden */
	protected setRef<K extends RefKeys<Attributes>>(
		attribute: K,
		value: (GraphNode & Attributes[K]) | null,
		attributes?: Record<string, unknown>
	): this {
		if (this[$immutableKeys].has(attribute as string)) {
			throw new Error(`Cannot overwrite immutable attribute, "${attribute as string}".`);
		}

		const prevRef = this[$attributes][attribute] as Ref;
		if (prevRef) prevRef.dispose(); // TODO(cleanup): Possible duplicate event.

		if (!value) return this;

		const ref = this.graph.createEdge(attribute as string, this, value, attributes);
		ref.addEventListener('dispose', () => {
			delete this[$attributes][attribute];
			this.dispatchEvent({ type: 'change', attribute });
		});
		(this[$attributes][attribute] as Ref) = ref;

		return this.dispatchEvent({ type: 'change', attribute });
	}

	/**********************************************************************************************
	 * RefList: 1:many graph node references.
	 */

	/** @hidden */
	protected listRefs<K extends RefListKeys<Attributes>>(attribute: K): GraphNode[] & Attributes[K] {
		const refs = this[$attributes][attribute] as Ref[];
		return refs.map((ref) => ref.getChild()) as GraphNode[] & Attributes[K];
	}

	/** @hidden */
	protected addRef<K extends RefListKeys<Attributes>>(
		attribute: K,
		value: GraphNode & Attributes[K][keyof Attributes[K]],
		attributes?: Record<string, unknown>
	): this {
		const ref = this.graph.createEdge(attribute as string, this, value, attributes);

		const refs = this[$attributes][attribute] as Ref[];
		refs.push(ref);

		ref.addEventListener('dispose', () => {
			let index;
			while ((index = refs.indexOf(ref)) !== -1) {
				refs.splice(index, 1);
			}
			this.dispatchEvent({ type: 'change', attribute });
		});

		return this.dispatchEvent({ type: 'change', attribute });
	}

	/** @hidden */
	protected removeRef<K extends RefListKeys<Attributes>>(
		attribute: K,
		value: GraphNode & Attributes[K][keyof Attributes[K]]
	): this {
		const refs = this[$attributes][attribute] as Ref[];
		const pruned = refs.filter((ref) => ref.getChild() === value);
		pruned.forEach((ref) => ref.dispose()); // TODO(cleanup): Possible duplicate event.
		return this;
	}

	/**********************************************************************************************
	 * RefMap: Named 1:many (map) graph node references.
	 */

	/** @hidden */
	protected listRefMapKeys<K extends RefMapKeys<Attributes>>(key: K): string[] {
		return Object.keys(this[$attributes][key] as any);
	}

	/** @hidden */
	protected listRefMapValues<K extends RefMapKeys<Attributes>>(
		key: K
	): GraphNode[] & Attributes[K][keyof Attributes[K]][] {
		return Object.values(this[$attributes][key] as any).map((ref: any) => ref.getChild());
	}

	/** @hidden */
	protected getRefMap<K extends RefMapKeys<Attributes>, SK extends keyof Attributes[K]>(
		attribute: K,
		key: SK
	): (GraphNode & Attributes[K][SK]) | null {
		const refMap = this[$attributes][attribute] as any;
		return refMap[key] ? refMap[key].getChild() : null;
	}

	/** @hidden */
	protected setRefMap<K extends RefMapKeys<Attributes>, SK extends keyof Attributes[K]>(
		attribute: K,
		key: SK,
		value: (GraphNode & Attributes[K][SK]) | null,
		metadata?: Record<string, unknown>
	): this {
		const refMap = this[$attributes][attribute] as any;

		const prevRef = refMap[key];
		if (prevRef) prevRef.dispose(); // TODO(cleanup): Possible duplicate event.

		if (!value) return this;

		metadata = Object.assign(metadata || {}, { key: key });
		const ref = this.graph.createEdge(attribute as string, this, value, { ...metadata, key });
		ref.addEventListener('dispose', () => {
			delete refMap[key];
			this.dispatchEvent({ type: 'change', attribute, key });
		});
		refMap[key] = ref;

		return this.dispatchEvent({ type: 'change', attribute, key });
	}

	/**********************************************************************************************
	 * Events.
	 */

	/**
	 * Dispatches an event on the GraphNode, and on the associated
	 * Graph. Event types on the graph are prefixed, `"node:[type]"`.
	 */
	dispatchEvent(event: BaseEvent): this {
		super.dispatchEvent({ ...event, target: this });
		this.graph.dispatchEvent({ ...event, target: this, type: `node:${event.type}` });
		return this;
	}
}
