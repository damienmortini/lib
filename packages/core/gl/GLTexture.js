export default class GLTexture {
  constructor({
    gl,
    data = undefined,
    width = undefined,
    height = undefined,
    target = gl.TEXTURE_2D,
    level = 0,
    internalFormat = gl.RGBA8 || gl.RGBA,
    format = gl.RGBA,
    type = gl.UNSIGNED_BYTE,
    autoGenerateMipmap = true,
    minFilter = autoGenerateMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
    magFilter = gl.LINEAR,
    wrapS = gl.CLAMP_TO_EDGE,
    wrapT = gl.CLAMP_TO_EDGE,
    flipY = false,
  }) {
    this.gl = gl;
    this._texture = this.gl.createTexture();
    this._width = width;
    this._height = height;
    this._dataWidth = undefined;
    this._dataHeight = undefined;
    this._target = target;
    this._unit = 0;

    this.autoGenerateMipmap = autoGenerateMipmap;
    this.level = level;
    this.internalFormat = internalFormat;
    this.format = format;
    this.type = type;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.wrapS = wrapS;
    this.wrapT = wrapT;
    this.flipY = flipY;
    this.data = data;
  }

  generateMipmap() {
    this.bind();
    this.gl.generateMipmap(this._target);
    this.unbind();
  }

  set data(value) {
    this._data = value;

    if (this._data && (this._data.length === undefined)) {
      this._dataWidth = this._data.width || this._data.videoWidth;
      this._dataHeight = this._data.height || this._data.videoHeight;
    }

    this.bind();
    // As another texture upload may have changed pixelStorei
    // parameters, make sure they are correct
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.flipY);

    if (this.gl instanceof WebGLRenderingContext && this._data && this._data.length === undefined) {
      this.gl.texImage2D(this._target, this.level, this.internalFormat, this.format, this.type, this._data);
    } else {
      this.gl.texImage2D(this._target, this.level, this.internalFormat, this.width, this.height, 0, this.format, this.type, this._data || null);
    }
    if (this.autoGenerateMipmap) {
      this.gl.generateMipmap(this._target);
    }
    this.unbind();
  }

  get data() {
    return this._data;
  }

  set width(value) {
    this._width = value;
    this.data = this.data;
  }

  get width() {
    return this._width || this._dataWidth;
  }

  set height(value) {
    this._height = value;
    this.data = this.data;
  }

  get height() {
    return this._height || this._dataHeight;
  }

  set minFilter(value) {
    if (this._minFilter === value) {
      return;
    }
    this._minFilter = value;
    this.bind();
    this.gl.texParameteri(this._target, this.gl.TEXTURE_MIN_FILTER, this._minFilter);
    this.unbind();
  }

  get minFilter() {
    return this._minFilter;
  }

  set magFilter(value) {
    if (this._magFilter === value) {
      return;
    }
    this._magFilter = value;
    this.bind();
    this.gl.texParameteri(this._target, this.gl.TEXTURE_MAG_FILTER, this._magFilter);
    this.unbind();
  }

  get magFilter() {
    return this._magFilter;
  }

  set wrapS(value) {
    if (this._wrapS === value) {
      return;
    }
    this._wrapS = value;
    this.bind();
    this.gl.texParameteri(this._target, this.gl.TEXTURE_WRAP_S, this._wrapS);
    this.unbind();
  }

  get wrapS() {
    return this._wrapS;
  }

  set wrapT(value) {
    if (this._wrapT === value) {
      return;
    }
    this._wrapT = value;
    this.bind();
    this.gl.texParameteri(this._target, this.gl.TEXTURE_WRAP_T, this._wrapT);
    this.unbind();
  }

  get wrapT() {
    return this._wrapT;
  }

  set flipY(value) {
    if (this._flipY === value) {
      return;
    }
    this._flipY = value;
    this.bind();
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this._flipY);
    this.unbind();
  }

  get flipY() {
    return this._flipY;
  }

  bind({ unit = 0 } = {}) {
    this._unit = unit;
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this._target, this._texture);
  }

  unbind({ unit = this._unit } = {}) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this._target, null);
  }

  clone() {
    return new GLTexture(this);
  }
}
