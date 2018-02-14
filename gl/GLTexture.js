export default class GLTexture {
  constructor({
    gl, 
    data = null, 
    width = undefined,
    height = undefined,
    target = (data && data.length) ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D,
    level = 0,
    internalformat = gl.RGBA,
    format = gl.RGBA,
    type = gl.UNSIGNED_BYTE,
    minFilter = gl.NEAREST_MIPMAP_LINEAR, 
    magFilter = gl.LINEAR, 
    wrapS = gl.REPEAT, 
    wrapT = gl.REPEAT
  }) {
    this.gl = gl;
    this._texture = this.gl.createTexture();
    this._width = width;
    this._height = height;
    this._dataWidth = undefined;
    this._dataHeight = undefined;
    this._target = target;
    
    this.level = level;
    this.internalformat = internalformat;
    this.format = format;
    this.type = type;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.wrapS = wrapS;
    this.wrapT = wrapT;
    this.data = data;
  }

  generateMipmap() {
    this.bind();
    this.gl.generateMipmap(this._target);
    this.unbind();
  }

  set data(value) {
    this._data = value;

    if(!this._data && !(this._width && this._height)) {
      return;
    }

    const data = (this._data && this._data.length) ? this._data : [this._data];

    if(data[0]) {
      this._dataWidth = data[0].width || data[0].videoWidth;
      this._dataHeight = data[0].height || data[0].videoHeight;
    }

    const count = this._target === this.gl.TEXTURE_CUBE_MAP ? 6 : 1;
    const target = this._target === this.gl.TEXTURE_CUBE_MAP ? this.gl.TEXTURE_CUBE_MAP_POSITIVE_X : this._target;

    this.bind();
    for (let i = 0; i < data.length; i++) {
      if(this.gl.getParameter(this.gl.VERSION).startsWith("WebGL 1.0") && this._dataWidth) {
        this.gl.texImage2D(target + i, this.level, this.internalformat, this.format, this.type, data[i]);
      } else {
        this.gl.texImage2D(target + i, this.level, this.internalformat, this.width, this.height, 0, this.format, this.type, data[i]);
      }
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
    if(this._minFilter === value) {
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
    if(this._magFilter === value) {
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
    if(this._wrapS === value) {
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
    if(this._wrapT === value) {
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

  bind({unit = 0} = {}) {
    this.gl.activeTexture(this.gl[`TEXTURE${unit}`]);
    this.gl.bindTexture(this._target, this._texture);
  }

  unbind() {
    this.gl.bindTexture(this._target, null);
  }
};
