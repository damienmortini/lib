export default class PlaneGeometry {
    constructor({ width, height, columns, rows, positions, normals, uvs, indices, facingUp, }?: {
        width?: number;
        height?: number;
        columns?: number;
        rows?: number;
        positions?: boolean;
        normals?: boolean;
        uvs?: boolean;
        indices?: boolean;
        facingUp?: boolean;
    });
    positions: Float32Array;
    normals: Float32Array;
    uvs: Float32Array;
    indices: Uint8Array | Uint16Array | Uint32Array;
}
