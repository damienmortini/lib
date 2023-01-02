export default class Vector4 extends Float32Array {
    constructor(array?: number[]);
    set x(arg: any);
    get x(): any;
    0: any;
    set y(arg: any);
    get y(): any;
    1: any;
    set z(arg: any);
    get z(): any;
    2: any;
    set w(arg: any);
    get w(): any;
    3: any;
    set(x: any, y: any, z: any, w: any): Vector4;
    applyMatrix4(matrix4: any): Vector4;
}
