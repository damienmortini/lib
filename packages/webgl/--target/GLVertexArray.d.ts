export class GLVertexArray {
    constructor({ gl, geometry, program }: {
        gl: any;
        geometry?: any;
        program?: any;
    });
    gl: any;
    add({ geometry, program }?: {
        geometry?: any;
        program?: any;
    }): void;
    bind(): void;
    unbind(): void;
    #private;
}
