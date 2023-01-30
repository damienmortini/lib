export default class GLBuffer {
    constructor({ gl, data, target, usage, }: {
        gl: any;
        data?: any;
        target?: any;
        usage?: any;
    });
    gl: any;
    target: any;
    usage: any;
    set data(arg: any);
    get data(): any;
    bind({ target, index, offset, size, }?: {
        target?: any;
        index?: any;
        offset?: number;
        size?: any;
    }): void;
    unbind({ target, index, offset, size, }?: {
        target?: any;
        index?: any;
        offset?: number;
        size?: any;
    }): void;
    #private;
}
