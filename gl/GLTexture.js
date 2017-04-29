export default class GLTexture {
  constructor({gl, image, color = [1, 1, 1, 1], generateMipmap = false} = {}) {
    this.gl = gl;
    this._texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this._texture);
    if(image) {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA,this.gl.UNSIGNED_BYTE, image);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([color[0] * 255, color[1] * 255, color[2] * 255, color[3] * 255]));
    }
  }

  generateMipmap() {
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
  }

  bind() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this._texture);
  }

  unbind() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }
};
