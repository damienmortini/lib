/**
 * Current version of the package.
 * @hidden
 */
export declare const VERSION: string;
/**
 * TypeScript utility for nullable types.
 * @hidden
 */
export type Nullable<T> = {
    [P in keyof T]: T[P] | null;
};
/**
 * 2-dimensional vector.
 * @hidden
 */
export type vec2 = [number, number];
/**
 * 3-dimensional vector.
 * @hidden
 */
export type vec3 = [number, number, number];
/**
 * 4-dimensional vector, e.g. RGBA or a quaternion.
 * @hidden
 */
export type vec4 = [number, number, number, number];
/**
 * 3x3 matrix, e.g. an affine transform of a 2D vector.
 * @hidden
 */
export type mat3 = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
];
/**
 * 4x4 matrix, e.g. an affine transform of a 3D vector.
 * @hidden
 */
export type mat4 = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
];
/** @hidden */
export type bbox = {
    min: vec3;
    max: vec3;
};
/** @hidden */
export declare const GLB_BUFFER = "@glb.bin";
/**
 * Abstraction representing any one of the typed array classes supported by glTF and JavaScript.
 * @hidden
 */
export type TypedArray = Float32Array | Uint32Array | Uint16Array | Uint8Array | Int16Array | Int8Array;
/**
 * Abstraction representing the typed array constructors supported by glTF and JavaScript.
 * @hidden
 */
export type TypedArrayConstructor = Float32ArrayConstructor | Uint32ArrayConstructor | Uint16ArrayConstructor | Uint8ArrayConstructor | Int16ArrayConstructor | Int8ArrayConstructor;
/** String IDs for core {@link Property} types. */
export declare enum PropertyType {
    ACCESSOR = "Accessor",
    ANIMATION = "Animation",
    ANIMATION_CHANNEL = "AnimationChannel",
    ANIMATION_SAMPLER = "AnimationSampler",
    BUFFER = "Buffer",
    CAMERA = "Camera",
    MATERIAL = "Material",
    MESH = "Mesh",
    PRIMITIVE = "Primitive",
    PRIMITIVE_TARGET = "PrimitiveTarget",
    NODE = "Node",
    ROOT = "Root",
    SCENE = "Scene",
    SKIN = "Skin",
    TEXTURE = "Texture",
    TEXTURE_INFO = "TextureInfo"
}
/** Vertex layout method. */
export declare enum VertexLayout {
    /**
     * Stores vertex attributes in a single buffer view per mesh primitive. Interleaving vertex
     * data may improve performance by reducing page-thrashing in GPU memory.
     */
    INTERLEAVED = "interleaved",
    /**
     * Stores each vertex attribute in a separate buffer view. May decrease performance by causing
     * page-thrashing in GPU memory. Some 3D engines may prefer this layout, e.g. for simplicity.
     */
    SEPARATE = "separate"
}
/** Accessor usage. */
export declare enum BufferViewUsage {
    ARRAY_BUFFER = "ARRAY_BUFFER",
    ELEMENT_ARRAY_BUFFER = "ELEMENT_ARRAY_BUFFER",
    INVERSE_BIND_MATRICES = "INVERSE_BIND_MATRICES",
    OTHER = "OTHER",
    SPARSE = "SPARSE"
}
/** Texture channels. */
export declare enum TextureChannel {
    R = 4096,
    G = 256,
    B = 16,
    A = 1
}
export declare enum Format {
    GLTF = "GLTF",
    GLB = "GLB"
}
export declare const ComponentTypeToTypedArray: {
    '5120': Int8ArrayConstructor;
    '5121': Uint8ArrayConstructor;
    '5122': Int16ArrayConstructor;
    '5123': Uint16ArrayConstructor;
    '5125': Uint32ArrayConstructor;
    '5126': Float32ArrayConstructor;
};
