declare namespace _default {
    export { byteLength };
    export { toByteArray };
    export { fromByteArray };
}
export default _default;
declare function byteLength(b64: any): number;
declare function toByteArray(b64: any): any[] | Uint8Array;
declare function fromByteArray(uint8: any): string;
