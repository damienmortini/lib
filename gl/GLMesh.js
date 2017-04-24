import GLBuffer from "./GLBuffer.js";

export default class GLMesh {
  constructor({gl, vertices = new Float32Array(), uvs = new Float32Array(), indices = new Uint16Array} = {}) {
    this.gl = gl;

    this.attributes = new Map();

    this._indices = indices;
    this._vertices = vertices;

    this.attributes.set("position", {
      buffer: new GLBuffer({
        gl: this.gl, 
        data: vertices
      }),
      size: 3
    });

    this.attributes.set("uv", {
      buffer: new GLBuffer({
        gl: this.gl,
        data: uvs
      }),
      size: 2
    });

    this.indexBuffer = new GLBuffer({
      gl: this.gl,
      data: indices,
      target: this.gl.ELEMENT_ARRAY_BUFFER
    });
  }

  bind() {
    this.attributes.get("position").buffer.bind();
    this.attributes.get("uv").buffer.bind();
    this.indexBuffer.bind();
  }

  draw () {
    this.gl.drawElements(this.gl.TRIANGLES, this._indices.length, this.gl.UNSIGNED_SHORT, 0);
  }
};
