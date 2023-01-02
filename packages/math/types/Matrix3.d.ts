export default class Matrix3 extends Float32Array {
    constructor(array?: number[]);
    set x(arg: any);
    get x(): any;
    6: any;
    set y(arg: any);
    get y(): any;
    7: any;
    set z(arg: any);
    get z(): any;
    8: any;
    set(m00: any, m01: any, m02: any, m10: any, m11: any, m12: any, m20: any, m21: any, m22: any): Matrix3;
    translate(vector2: any, matrix3?: Matrix3): Matrix3;
    rotate(value: any, matrix3?: Matrix3): Matrix3;
    scale(vector2: any, matrix3?: Matrix3): Matrix3;
    multiply(matrix3a: any, matrix3b: any): Matrix3;
    identity(): Matrix3;
    copy(matrix3: any): Matrix3;
    fromMatrix4(matrix4: any): Matrix3;
    fromQuaternion(quaternion: any): Matrix3;
    fromBasis(vector3a: any, vector3b: any, vector3c: any): Matrix3;
    normalMatrixFromTransform(matrix4: any): Matrix3;
    invert(matrix3?: Matrix3): Matrix3;
}
