export class GLTexture {
  #glTexture;
  #width;
  #height;
  #dataWidth;
  #dataHeight;
  #target;
  #unit = 0;
  #flipY;
  #wrapT;
  #wrapS;
  #magFilter;
  #minFilter;
  #data;

  constructor({
    gl = {}, // Default value to remove when https://github.com/microsoft/vscode/issues/147777 will be resolved
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
    this.#glTexture = this.gl.createTexture();
    this.#width = width;
    this.#height = height;
    this.#target = target;

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
    this.gl.generateMipmap(this.#target);
    this.unbind();
  }

  set data(value) {
    this.#data = value;

    if (this.#data && this.#data.length === undefined) {
      this.#dataWidth = this.#data.width || this.#data.videoWidth;
      this.#dataHeight = this.#data.height || this.#data.videoHeight;
    }

    this.bind();
    // As another texture upload may have changed pixelStorei
    // parameters, make sure they are correct
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.flipY);

    if (this.gl instanceof WebGLRenderingContext && this.#data && this.#data.length === undefined) {
      this.gl.texImage2D(this.#target, this.level, this.internalFormat, this.format, this.type, this.#data);
    }
    else {
      this.gl.texImage2D(
        this.#target,
        this.level,
        this.internalFormat,
        this.width,
        this.height,
        0,
        this.format,
        this.type,
        this.#data || null,
      );
    }
    if (this.autoGenerateMipmap) {
      this.gl.generateMipmap(this.#target);
    }
    this.unbind();
  }

  get data() {
    return this.#data;
  }

  set width(value) {
    this.#width = value;
    this.data = this.data;
  }

  get width() {
    return this.#width || this.#dataWidth;
  }

  set height(value) {
    this.#height = value;
    this.data = this.data;
  }

  get height() {
    return this.#height || this.#dataHeight;
  }

  set minFilter(value) {
    if (this.#minFilter === value) {
      return;
    }
    this.#minFilter = value;
    this.bind();
    this.gl.texParameteri(this.#target, this.gl.TEXTURE_MIN_FILTER, this.#minFilter);
    this.unbind();
  }

  get minFilter() {
    return this.#minFilter;
  }

  set magFilter(value) {
    if (this.#magFilter === value) {
      return;
    }
    this.#magFilter = value;
    this.bind();
    this.gl.texParameteri(this.#target, this.gl.TEXTURE_MAG_FILTER, this.#magFilter);
    this.unbind();
  }

  get magFilter() {
    return this.#magFilter;
  }

  set wrapS(value) {
    if (this.#wrapS === value) {
      return;
    }
    this.#wrapS = value;
    this.bind();
    this.gl.texParameteri(this.#target, this.gl.TEXTURE_WRAP_S, this.#wrapS);
    this.unbind();
  }

  get wrapS() {
    return this.#wrapS;
  }

  set wrapT(value) {
    if (this.#wrapT === value) {
      return;
    }
    this.#wrapT = value;
    this.bind();
    this.gl.texParameteri(this.#target, this.gl.TEXTURE_WRAP_T, this.#wrapT);
    this.unbind();
  }

  get wrapT() {
    return this.#wrapT;
  }

  set flipY(value) {
    if (this.#flipY === value) {
      return;
    }
    this.#flipY = value;
    this.bind();
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.#flipY);
    this.unbind();
  }

  get flipY() {
    return this.#flipY;
  }

  get glTexture() {
    return this.#glTexture;
  }

  bind({ unit = 0 } = {}) {
    this.#unit = unit;
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.#target, this.#glTexture);
  }

  unbind({ unit = this.#unit } = {}) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.#target, null);
  }

  clone() {
    return new GLTexture(this);
  }
}
