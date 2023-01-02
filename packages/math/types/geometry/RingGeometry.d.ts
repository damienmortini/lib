export default class RingGeometry {
    constructor({ innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength, positions, normals, uvs, indices, }?: {
        innerRadius?: number;
        outerRadius?: number;
        thetaSegments?: number;
        phiSegments?: number;
        thetaStart?: number;
        thetaLength?: number;
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
