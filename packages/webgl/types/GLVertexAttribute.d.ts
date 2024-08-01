export default class GLVertexAttribute {
  constructor({ gl, data, target, size, componentType, byteOffset, normalized, byteStride, count, divisor }: {
    gl: any;
    data?: any;
    target?: any;
    size?: number;
    componentType?: any;
    byteOffset?: number;
    normalized?: boolean;
    byteStride?: number;
    count?: number;
    divisor?: number;
  });
  gl: any;
  data: any;
  size: any;
  componentType: any;
  byteOffset: number;
  normalized: boolean;
  byteStride: number;
  count: number;
  divisor: number;
  get buffer(): GLBuffer;
  get typedArray(): any;
  #private;
}
import GLBuffer from './GLBuffer.js';
