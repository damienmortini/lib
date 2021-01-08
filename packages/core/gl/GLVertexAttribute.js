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
    data = undefined,
    buffer = new GLBuffer({
      gl,
    }),
    size = 1,
    type = ARRAY_TYPE_MAP.get(data?.constructor),
    offset = 0,
    normalized = false,
    stride = 0,
    count = data?.length / size || 1,
    divisor = 0,
  }) {
    this.gl = gl;
    this.buffer = buffer;
    this.size = size;
    this.type = type;
    this.offset = offset;
    this.normalized = normalized;
    this.stride = stride;
    this.count = count;
    this.divisor = divisor;

    if (data) {
      this.data = data;
    }
  }

  set data(value) {
    this._data = value;
    this.buffer.data = value;
  }

  get data() {
    return this._data ?? new (TYPE_ARRAY_MAP.get(this.type))(this.buffer.data, this.offset, this.count * this.size);
  }
}
