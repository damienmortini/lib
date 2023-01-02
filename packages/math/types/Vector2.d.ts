export default class Vector2 extends Float32Array {
    static distance(vector2a: any, vector2b: any): number;
    /**
     * Creates an instance of Vector2.
     * @param {Array | Float32Array} array
     */
    constructor(array?: any[] | Float32Array);
    set x(arg: any);
    get x(): any;
    0: any;
    set y(arg: any);
    get y(): any;
    1: any;
    set(x: any, y: any): Vector2;
    copy(vector2: any): Vector2;
    add(vector2: any): Vector2;
    multiply(vector2: any): Vector2;
    get size(): number;
    get squaredSize(): number;
    subtract(vector2: any): Vector2;
    negate(vector2?: Vector2): Vector2;
    cross(vector2a: any, vector2b: any): Vector2;
    scale(value: any): Vector2;
    normalize(): vec2;
    dot(vector2: any): number;
    distance(vector2: any): number;
    equals(vector2: any): boolean;
    applyMatrix3(matrix3: any): Vector2;
    applyMatrix4(matrix4: any): Vector2;
    rotate(vector2: any, value: any): void;
    lerp(vector2: any, value: any): void;
    clone(): Vector2;
}
import { vec2 } from "gl-matrix";
