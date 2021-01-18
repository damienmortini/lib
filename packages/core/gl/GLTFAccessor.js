const ATTRIBUTE_TYPE_SIZE_MAP = new Map([
  ['SCALAR', 1],
  ['VEC2', 2],
  ['VEC3', 3],
  ['VEC4', 4],
  ['MAT2', 4],
  ['MAT3', 9],
  ['MAT4', 16],
]);

const TYPE_ARRAY_MAP = new Map([
  [WebGLRenderingContext.BYTE, Int8Array],
  [WebGLRenderingContext.UNSIGNED_BYTE, Uint8Array],
  [WebGLRenderingContext.SHORT, Int16Array],
  [WebGLRenderingContext.UNSIGNED_SHORT, Uint16Array],
  [WebGLRenderingContext.INT, Int32Array],
  [WebGLRenderingContext.UNSIGNED_INT, Uint32Array],
  [WebGLRenderingContext.FLOAT, Float32Array],
]);

export default class GLTFAccessor {
  constructor({
    data,
  }) {
    this.bufferView = data.bufferView;
    this.byteOffset = (data.byteOffset || 0) + data.bufferView.byteOffset;
    this.byteStride = data.bufferView.byteStride ?? 0;
    this.componentType = data.componentType;
    this.normalized = data.normalized ?? false;
    this.count = data.count;
    this.type = data.type;
    this.max = data.max;
    this.min = data.min;
    this.size = ATTRIBUTE_TYPE_SIZE_MAP.get(this.type);

    this._typedArray = null;
  }

  get buffer() {
    return this.bufferView.buffer;
  }

  get typedArray() {
    if (!this._typedArray) {
      this._typedArray = new (TYPE_ARRAY_MAP.get(this.componentType))(this.buffer, this.byteOffset, this.count * this.size);
    }
    return this._typedArray;
  }
}
