export class GLBoxObject extends GLObject {
    constructor({ gl, width, height, depth, widthSegments, heightSegments, depthSegments, normals, uvs, attributes, program, }: {
        gl: any;
        width?: number;
        height?: number;
        depth?: number;
        widthSegments?: number;
        heightSegments?: number;
        depthSegments?: number;
        normals?: boolean;
        uvs?: boolean;
        attributes?: {};
        program?: GLProgram;
    });
}
import { GLObject } from "../GLObject.js";
import { GLProgram } from "../GLProgram.js";
