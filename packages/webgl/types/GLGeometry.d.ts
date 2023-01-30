export class GLGeometry {
    constructor({ gl, positions, normals, uvs, attributes, indices }: {
        gl: any;
        positions?: any;
        normals?: any;
        uvs?: any;
        attributes?: {};
        indices?: any;
    });
    gl: any;
    indices: GLVertexAttribute;
    attributes: Map<any, any>;
    draw({ mode, elements, count, offset, type, first, instanceCount, }?: {
        mode?: any;
        elements?: boolean;
        count?: any;
        offset?: number;
        type?: any;
        first?: number;
        instanceCount?: any;
    }): void;
    #private;
}
import GLVertexAttribute from "./GLVertexAttribute.js";
