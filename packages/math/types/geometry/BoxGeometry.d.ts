export default class BoxGeometry {
    constructor({ width, height, depth, widthSegments, heightSegments, depthSegments, positions, normals, uvs, indices, }?: {
        width?: number;
        height?: number;
        depth?: number;
        widthSegments?: number;
        heightSegments?: number;
        depthSegments?: number;
        positions?: boolean;
        normals?: boolean;
        uvs?: boolean;
        indices?: boolean;
    });
    positions: Float32Array;
    normals: Float32Array;
    uvs: Float32Array;
    indices: Uint8Array | Uint16Array | Uint32Array;
}
