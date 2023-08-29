import type { Graph } from './graph.js';
import type { GraphNode } from './graph-node.js';
import type { GraphEdge } from './graph-edge.js';

export interface BaseEvent {
	type: string;
	[attachment: string]: unknown;
}

export interface GraphEvent extends BaseEvent {
	target: Graph<GraphNode>;
}

export interface GraphNodeEvent extends BaseEvent {
	target: GraphNode;
}

export interface GraphEdgeEvent extends BaseEvent {
	target: GraphEdge<GraphNode, GraphNode>;
}

export type EventListener<E> = (event: E) => void;

export class EventDispatcher<T extends BaseEvent> {
	private _listeners = {} as Record<string, EventListener<T>[]>;

	addEventListener(type: string, listener: EventListener<T>): this {
		const listeners = this._listeners;

		if (listeners[type] === undefined) {
			listeners[type] = [] as EventListener<T>[];
		}

		if (listeners[type].indexOf(listener) === -1) {
			listeners[type].push(listener);
		}

		return this;
	}

	removeEventListener(type: string, listener: EventListener<T>): this {
		if (this._listeners === undefined) return this;

		const listeners = this._listeners;
		const listenerArray = listeners[type];

		if (listenerArray !== undefined) {
			const index = listenerArray.indexOf(listener);

			if (index !== -1) {
				listenerArray.splice(index, 1);
			}
		}

		return this;
	}

	dispatchEvent(event: T): this {
		if (this._listeners === undefined) return this;

		const listeners = this._listeners;
		const listenerArray = listeners[event.type];

		if (listenerArray !== undefined) {
			// Make a copy, in case listeners are removed while iterating.
			const array = listenerArray.slice(0);

			for (let i = 0, l = array.length; i < l; i++) {
				array[i].call(this, event as T);
			}
		}

		return this;
	}

	dispose(): void {
		for (const key in this._listeners) {
			delete this._listeners[key];
		}
	}
}
