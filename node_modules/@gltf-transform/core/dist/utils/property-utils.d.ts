import type { GraphEdge } from 'property-graph';
import type { BufferViewUsage } from '../constants.js';
import type { Property } from '../properties/index.js';
export type Ref = GraphEdge<Property, Property>;
export type RefMap = {
    [key: string]: Ref;
};
export type UnknownRef = Ref | Ref[] | RefMap | unknown;
export declare function equalsRef(refA: Ref, refB: Ref): boolean;
export declare function equalsRefList(refListA: Ref[], refListB: Ref[]): boolean;
export declare function equalsRefMap(refMapA: RefMap, refMapB: RefMap): boolean;
export declare function equalsArray(a: ArrayLike<unknown> | null, b: ArrayLike<unknown> | null): boolean;
export declare function equalsObject(_a: unknown, _b: unknown): boolean;
export type RefAttributes = Record<string, unknown>;
export interface AccessorRefAttributes extends RefAttributes {
    /** Usage role of an accessor reference. */
    usage: BufferViewUsage | string;
}
export interface TextureRefAttributes extends RefAttributes {
    /** Bitmask for {@link TextureChannel TextureChannels} used by a texture reference. */
    channels: number;
    /**
     * Specifies that the texture contains color data (base color, emissive, …),
     * rather than non-color data (normal maps, metallic roughness, …). Used
     * when tuning texture compression settings.
     */
    isColor?: boolean;
}
export declare function isArray(value: unknown): boolean;
