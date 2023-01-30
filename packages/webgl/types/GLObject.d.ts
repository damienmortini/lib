export class GLObject {
    constructor({ gl, geometry, program }: {
        gl: any;
        geometry?: any;
        program?: any;
    });
    gl: any;
    set geometry(arg: any);
    get geometry(): any;
    set program(arg: any);
    get program(): any;
    get vertexArray(): any;
    bind(): void;
    draw({ mode, bind, uniforms, instanceCount, ...options }?: {
        mode?: any;
        bind?: boolean;
        uniforms?: {};
        instanceCount?: any;
    }): void;
    unbind(): void;
    #private;
}
