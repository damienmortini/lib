import GLBuffer from "./GLBuffer.js";

export default class GLMesh {
  constructor({gl, positions, uvs, normals, indices} = {}) {
    this.gl = gl;

    this.attributes = new Map();

    this._indices = indices;

    this._binded = false;

    if(positions) {
      this.attributes.set("position", {
        buffer: new GLBuffer({
          gl: this.gl, 
          data: positions
        }),
        count: positions.length / 3,
        size: 3
      });
    }

    if(normals) {
      this.attributes.set("normal", {
        buffer: new GLBuffer({
          gl: this.gl, 
          data: normals
        }),
        count: normals.length / 3,
        size: 3
      });
    }

    if(uvs) {
      this.attributes.set("uv", {
        buffer: new GLBuffer({
          gl: this.gl,
          data: uvs
        }),
        count: uvs.length / 2,
        size: 2
      });
    }

    if(this._indices) {
      this.indexBuffer = new GLBuffer({
        gl: this.gl,
        data: this._indices,
        target: this.gl.ELEMENT_ARRAY_BUFFER
      });
    }
  }

  bind() {
    if(this._binded) {
      return;
    }
    for (let attribute of this.attributes.values()) {
      attribute.buffer.bind();
    }
    if(this._indices) {
      this.indexBuffer.bind();
    }
    this._binded = true;
  }

  unbind() {
    if(!this._binded) {
      return;
    }
    for (let attribute of this.attributes.values()) {
      attribute.buffer.unbind();
    }
    if(this._indices) {
      this.indexBuffer.unbind();
    }
    this._binded = false;
  }

  draw ({mode = this.gl.TRIANGLES, count = this.attributes.get("position").count} = {}) {
    this.bind();
    if(this._indices) {
      this.gl.drawElements(mode, this._indices.length, this.gl.UNSIGNED_SHORT, 0);
    } else {
      this.gl.drawArrays(mode, 0, count);
    }
  }
};
