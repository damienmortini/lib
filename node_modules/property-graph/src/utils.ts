import type { Ref, RefMap } from './constants.js';
import { GraphEdge } from './graph-edge.js';

export function isRef(value: Ref | unknown): boolean {
	return value instanceof GraphEdge;
}

export function isRefList(value: Ref[] | unknown): boolean {
	return Array.isArray(value) && value[0] instanceof GraphEdge;
}

export function isRefMap(value: RefMap | unknown): boolean {
	return !!(isPlainObject(value) && getFirstValue(value) instanceof GraphEdge);
}

function getFirstValue(value: Record<string, unknown>): unknown {
	for (const key in value) {
		return value[key];
	}
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && Object.getPrototypeOf(value) === Object.prototype;
}
