export default class GLTexture {
  constructor({
    gl, 
    image, 
    color = [1, 1, 1, 1], 
    minFilter = gl.NEAREST_MIPMAP_LINEAR, 
    magFilter = gl.LINEAR, 
    wrapS = gl.REPEAT, 
    wrapT = gl.REPEAT, 
    generateMipmap = false
  } = {}) {
    this.gl = gl;
    this._texture = this.gl.createTexture();
    this.bind();
    if(image) {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA,this.gl.UNSIGNED_BYTE, image);
    } else {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([color[0] * 255, color[1] * 255, color[2] * 255, color[3] * 255]));
    }

    this._minFilter = this.gl.NEAREST_MIPMAP_LINEAR;
    this._magFilter = this.gl.LINEAR;
    this._wrapS = this.gl.REPEAT;
    this._wrapT = this.gl.REPEAT;

    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.wrapS = wrapS;
    this.wrapT = wrapT;
  }

  generateMipmap() {
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
  }

  set minFilter(value) {
    if(this._minFilter === value) {
      return;
    }
    this._minFilter = value;
    this.bind();
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this._minFilter);
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
