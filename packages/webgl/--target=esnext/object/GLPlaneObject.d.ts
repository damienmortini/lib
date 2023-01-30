export class GLPlaneObject extends GLObject {
    constructor({ gl, width, height, columns, rows, normals, uvs, attributes, facingUp, program, }: {
        gl: any;
        width?: any;
        height?: any;
        columns?: any;
        rows?: any;
        normals?: boolean;
        uvs?: boolean;
        attributes?: any;
        facingUp?: boolean;
        program?: GLProgram;
    });
}
import { GLObject } from "../GLObject.js";
import { GLProgram } from "../GLProgram.js";
