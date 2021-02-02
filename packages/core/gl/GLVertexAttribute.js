import GLBuffer from './GLBuffer.js';

const TYPE_ARRAY_MAP = new Map([
  [WebGLRenderingContext.BYTE, Int8Array],
  [WebGLRenderingContext.UNSIGNED_BYTE, Uint8Array],
  [WebGLRenderingContext.SHORT, Int16Array],
  [WebGLRenderingContext.UNSIGNED_SHORT, Uint16Array],
  [WebGLRenderingContext.INT, Int32Array],
  [WebGLRenderingContext.UNSIGNED_INT, Uint32Array],
  [WebGLRenderingContext.FLOAT, Float32Array],
]);

const ARRAY_TYPE_MAP = new Map([
  [Int8Array, WebGLRenderingContext.BYTE],
  [Uint8Array, WebGLRenderingContext.UNSIGNED_BYTE],
  [Int16Array, WebGLRenderingContext.SHORT],
  [Uint16Array, WebGLRenderingContext.UNSIGNED_SHORT],
  [Int32Array, WebGLRenderingContext.INT],
  [Uint32Array, WebGLRenderingContext.UNSIGNED_INT],
  [Float32Array, WebGLRenderingContext.FLOAT],
  [Float64Array, WebGLRenderingContext.FLOAT],
]);

export default class GLVertexAttribute {
  constructor({
    gl,
    data = null,
    target = gl.ARRAY_BUFFER,
    size = 1,
    componentType = ARRAY_TYPE_MAP.get(data?.constructor),
    byteOffset = 0,
    normalized = false,
    byteStride = 0,
    count = data?.length / size || 1,
    divisor = 0,
  }) {
    this.gl = gl;
    this.data = data;
    this.size = size;
    this.componentType = componentType;
    this.byteOffset = byteOffset;
    this.normalized = normalized;
    this.byteStride = byteStride;
    this.count = count;
    this.divisor = divisor;

    this._buffer = data instanceof GLBuffer ? data : new GLBuffer({
      gl,
      data,
      target,
    });
  }

  get buffer() {
    return this._buffer;
  }

  get typedArray() {
    return new (TYPE_ARRAY_MAP.get(this.componentType))(this.buffer.data, this.byteOffset, this.count * this.size);
  }
}
