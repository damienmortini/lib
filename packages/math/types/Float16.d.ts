export default class Float16 {
    static encodeFloat16(value: any): number;
    static decodeFloat16(bin: any): number;
    static fromFloat32Array(float32Array: any): Uint16Array;
    static toFloat32Array(float16Array: any): Float32Array;
}
