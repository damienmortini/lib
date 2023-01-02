export default class RoundedBoxGeometry extends BoxGeometry {
    constructor({ width, height, depth, widthSegments, heightSegments, depthSegments, radius, radiusWidth, radiusHeight, radiusDepth, positions, normals, uvs, indices, }?: {
        width?: number;
        height?: number;
        depth?: number;
        widthSegments?: number;
        heightSegments?: number;
        depthSegments?: number;
        radius?: number;
        radiusWidth?: any;
        radiusHeight?: any;
        radiusDepth?: any;
        positions?: boolean;
        normals?: boolean;
        uvs?: boolean;
        indices?: boolean;
    });
}
import BoxGeometry from "./BoxGeometry.js";
