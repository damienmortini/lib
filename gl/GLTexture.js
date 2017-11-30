export default class GLTexture {
  constructor({
    gl, 
    data = null, 
    width = undefined,
    height = undefined,
    level = 0,
    internalformat = gl.RGBA,
    format = gl.RGBA,
    type = gl.UNSIGNED_BYTE,
    minFilter = gl.NEAREST_MIPMAP_LINEAR, 
    magFilter = gl.LINEAR, 
    wrapS = gl.REPEAT, 
    wrapT = gl.REPEAT
  } = {}) {
    this.gl = gl;
    this._texture = this.gl.createTexture();
    this._width = width;
    this._height = height;
    
    this.level = level;
    this.internalformat = internalformat;
    this.format = format;
    this.type = type;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.wrapS = wrapS;
    this.wrapT = wrapT;
    if(data || (this._width && this._height)) {
      this.data = data;
    }
  }

  generateMipmap() {
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
  }

  set data(value) {
    this._data = value;
    this.bind();
    const width = this._width || this._data.width || this._data.videoWidth;
    const height = this._height || this._data.height || this._data.videoHeight;
    if((this.gl instanceof WebGLRenderingContext) && (this._data.width || this._data.videoWidth)) {
      this.gl.texImage2D(this.gl.TEXTURE_2D, this.level, this.internalformat, this.format, this.type, this._data);
    } else {
      this.gl.texImage2D(this.gl.TEXTURE_2D, this.level, this.internalformat, width, height, 0, this.format, this.type, this._data);
    }
    this.unbind();
  }

  get data() {
    return this._data;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  set minFilter(value) {
    if(this._minFilter === value) {
      return;
    }
    this._minFilter = value;
    this.bind();
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this._minFilter);
    this.unbind();
  }

  get minFilter() {
    return this._minFilter;
  }

  set magFilter(value) {
    if(this._magFilter === value) {
      return;
    }
    this._magFilter = value;
    this.bind();
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this._magFilter);
    this.unbind();
  }

  get magFilter() {
    return this._magFilter;
  }

  set wrapS(value) {
    if(this._wrapS === value) {
      return;
    }
    this._wrapS = value;
    this.bind();
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this._wrapS);
    this.unbind();
  }

  get wrapS() {
    return this._wrapS;
  }

  set wrapT(value) {
    if(this._wrapT === value) {
      return;
    }
    this._wrapT = value;
    this.bind();
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this._wrapT);
    this.unbind();
  }

  get wrapT() {
    return this._wrapT;
  }

  bind({unit = 0} = {}) {
    this.gl.activeTexture(this.gl[`TEXTURE${unit}`]);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this._texture);
  }

  unbind() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }
};
