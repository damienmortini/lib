import GLBuffer from "./GLBuffer.js";

export default class GLMesh {
  constructor({gl, positionData, normalData, uvData, indiceData} = {}) {
    this.gl = gl;

    this.gl.getExtension("OES_element_index_uint");

    this.attributes = new Map();

    if(positionData) {
      this.attributes.set("position", {
        buffer: new GLBuffer({
          gl: this.gl, 
          data: positionData
        }),
        count: positionData.length / 3,
        size: 3
      });
    }

    if(normalData) {
      this.attributes.set("normal", {
        buffer: new GLBuffer({
          gl: this.gl, 
          data: normalData
        }),
        count: normalData.length / 3,
        size: 3
      });
    }

    if(uvData) {
      this.attributes.set("uv", {
        buffer: new GLBuffer({
          gl: this.gl,
          data: uvData
        }),
        count: uvData.length / 2,
        size: 2
      });
    }

    this.indices = {
      buffer: new GLBuffer({
        gl: this.gl,
        data: indiceData,
        target: this.gl.ELEMENT_ARRAY_BUFFER
      }),
      offset: 0,
      count: indiceData ? indiceData.length : 0
    }
  }

  bind() {
    for (let attribute of this.attributes.values()) {
      attribute.buffer.bind();
    }

    if(this.indices.buffer) {
      this.indices.buffer.bind();
    }
  }

  unbind() {
    for (let attribute of this.attributes.values()) {
      attribute.buffer.unbind();
    }
    
    if(this.indices.buffer) {
      this.indices.buffer.unbind();
    }
  }

  draw ({
    mode = this.gl.TRIANGLES, 
    elements = !!(this.indices.buffer.data.length || this.indices.buffer.data.byteLength),
    count = elements ? this.indices.count : this.attributes.get("position").count, 
    offset = this.indices.offset,
    first = 0
  } = {}) {
    if(elements) {
      let type = count > 65535 ? this.gl.UNSIGNED_INT : this.gl.UNSIGNED_SHORT;
      this.gl.drawElements(mode, count, type, offset);
    } else {
      this.gl.drawArrays(mode, first, count);
    }
  }
};
