export class GLTexture {
    constructor({ gl, data, width, height, target, level, internalFormat, format, type, autoGenerateMipmap, minFilter, magFilter, wrapS, wrapT, flipY, }: {
        gl?: {};
        data?: any;
        width?: any;
        height?: any;
        target?: any;
        level?: number;
        internalFormat?: any;
        format?: any;
        type?: any;
        autoGenerateMipmap?: boolean;
        minFilter?: any;
        magFilter?: any;
        wrapS?: any;
        wrapT?: any;
        flipY?: boolean;
    });
    gl: any;
    autoGenerateMipmap: any;
    level: number;
    internalFormat: any;
    format: any;
    type: any;
    set minFilter(arg: any);
    get minFilter(): any;
    set magFilter(arg: any);
    get magFilter(): any;
    set wrapS(arg: any);
    get wrapS(): any;
    set wrapT(arg: any);
    get wrapT(): any;
    set flipY(arg: any);
    get flipY(): any;
    set data(arg: any);
    get data(): any;
    generateMipmap(): void;
    set width(arg: any);
    get width(): any;
    set height(arg: any);
    get height(): any;
    get glTexture(): any;
    bind({ unit }?: {
        unit?: number;
    }): void;
    unbind({ unit }?: {
        unit?: number;
    }): void;
    clone(): GLTexture;
    #private;
}
