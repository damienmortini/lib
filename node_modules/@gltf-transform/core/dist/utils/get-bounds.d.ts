import { bbox } from '../constants.js';
import type { Node, Scene } from '../properties/index.js';
/**
 * Computes bounding box (AABB) in world space for the given {@link Node} or {@link Scene}.
 *
 * Example:
 *
 * ```ts
 * const {min, max} = getBounds(scene);
 * ```
 */
export declare function getBounds(node: Node | Scene): bbox;
/**
 * @deprecated Renamed to {@link getBounds}.
 * @hidden
 */
export declare const bounds: typeof getBounds;
