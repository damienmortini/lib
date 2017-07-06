import GLBuffer from "./GLBuffer.js";

export default class GLMesh {
  constructor({gl, attributes, indiceData} = {}) {
    this.gl = gl;

    this.gl.getExtension("OES_element_index_uint");

    this.attributes = new Map(attributes);

    for (let [name, attribute] of this.attributes) {
      attribute.buffer = new GLBuffer({
        gl: this.gl, 
        data: attribute.data
      });
      attribute.count = attribute.count || attribute.data.length / attribute.size;
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
    type = this.indices.type || count > 65535 ? this.gl.UNSIGNED_INT : this.gl.UNSIGNED_SHORT,
    first = 0,
    instanceCount
  } = {}) {
    if(elements) {
      if(instanceCount !== undefined) {
        this.gl.drawElementsInstanced(mode, count, type, offset, instanceCount);
      } else {
        this.gl.drawElements(mode, count, type, offset);
      }
    } else {
      if(instanceCount !== undefined) {
        this.gl.drawArraysInstanced(mode, first, count, instanceCount);
      } else {
        this.gl.drawArrays(mode, first, count);
      }
    }
  }
};
