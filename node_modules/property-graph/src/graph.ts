import { EventDispatcher, GraphEdgeEvent, GraphEvent, GraphNodeEvent } from './event-dispatcher.js';
import { GraphEdge } from './graph-edge.js';
import { GraphNode } from './graph-node.js';

/**
 * A graph manages a network of {@link GraphNode} nodes, connected
 * by {@link @Link} edges.
 */
export class Graph<T extends GraphNode> extends EventDispatcher<GraphEvent | GraphNodeEvent | GraphEdgeEvent> {
	private _emptySet: Set<GraphEdge<T, T>> = new Set();

	private _edges: Set<GraphEdge<T, T>> = new Set();
	private _parentEdges: Map<T, Set<GraphEdge<T, T>>> = new Map();
	private _childEdges: Map<T, Set<GraphEdge<T, T>>> = new Map();

	/** Returns a list of all parent->child edges on this graph. */
	public listEdges(): GraphEdge<T, T>[] {
		return Array.from(this._edges);
	}

	/** Returns a list of all edges on the graph having the given node as their child. */
	public listParentEdges(node: T): GraphEdge<T, T>[] {
		return Array.from(this._childEdges.get(node) || this._emptySet);
	}

	/** Returns a list of parent nodes for the given child node. */
	public listParents(node: T): T[] {
		return this.listParentEdges(node).map((edge) => edge.getParent());
	}

	/** Returns a list of all edges on the graph having the given node as their parent. */
	public listChildEdges(node: T): GraphEdge<T, T>[] {
		return Array.from(this._parentEdges.get(node) || this._emptySet);
	}

	/** Returns a list of child nodes for the given parent node. */
	public listChildren(node: T): T[] {
		return this.listChildEdges(node).map((edge) => edge.getChild());
	}

	public disconnectParents(node: T, filter?: (n: T) => boolean): this {
		let edges = this.listParentEdges(node);
		if (filter) {
			edges = edges.filter((edge) => filter(edge.getParent()));
		}
		edges.forEach((edge) => edge.dispose());
		return this;
	}

	/**
	 * Creates a {@link GraphEdge} connecting two {@link GraphNode} instances. Edge is returned
	 * for the caller to store.
	 * @param a Owner
	 * @param b Resource
	 */
	public createEdge<A extends T, B extends T>(
		name: string,
		a: A,
		b: B,
		attributes?: Record<string, unknown>
	): GraphEdge<A, B> {
		return this._registerEdge(new GraphEdge(name, a, b, attributes)) as GraphEdge<A, B>;
	}

	/**********************************************************************************************
	 * Internal.
	 */

	/** @hidden */
	private _registerEdge(edge: GraphEdge<T, T>): GraphEdge<T, T> {
		this._edges.add(edge);

		const parent = edge.getParent();
		if (!this._parentEdges.has(parent)) this._parentEdges.set(parent, new Set());
		this._parentEdges.get(parent)!.add(edge);

		const child = edge.getChild();
		if (!this._childEdges.has(child)) this._childEdges.set(child, new Set());
		this._childEdges.get(child)!.add(edge);

		edge.addEventListener('dispose', () => this._removeEdge(edge));
		return edge;
	}

	/**
	 * Removes the {@link GraphEdge} from the {@link Graph}. This method should only
	 * be invoked by the onDispose() listener created in {@link _registerEdge()}. The
	 * public method of removing an edge is {@link GraphEdge.dispose}.
	 */
	private _removeEdge(edge: GraphEdge<T, T>): this {
		this._edges.delete(edge);
		this._parentEdges.get(edge.getParent())!.delete(edge);
		this._childEdges.get(edge.getChild())!.delete(edge);
		return this;
	}
}
