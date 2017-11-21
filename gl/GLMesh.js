import GLBuffer from "./GLBuffer.js";

export default class GLMesh {
  constructor({gl, attributes, indiceData} = {}) {
    this.gl = gl;

    if(this.gl.SHADING_LANGUAGE_VERSION === 35724) {
      this.gl.getExtension("OES_element_index_uint");
      const instancedArraysExtension = this.gl.getExtension("ANGLE_instanced_arrays");
      this._drawElementsInstanced = instancedArraysExtension ? instancedArraysExtension.drawElementsInstancedANGLE.bind(instancedArraysExtension) : function() {};
      this._drawArraysInstanced = instancedArraysExtension ? instancedArraysExtension.drawArraysInstancedANGLE.bind(instancedArraysExtension) : function() {};
    } else {
      this._drawElementsInstanced = this.gl.drawElementsInstanced.bind(this.gl);
      this._drawArraysInstanced = this.gl.drawArraysInstance.bind(this.gl);
    }

    this.attributes = new Map(attributes);

    for (let [name, attribute] of this.attributes) {
      attribute.buffer = new GLBuffer({
        gl: this.gl, 
        data: attribute.data
      });
      attribute.count = attribute.count || attribute.data.length / attribute.size;
    }
    
    if(indiceData) {
      this.indices = {
        buffer: new GLBuffer({
          gl: this.gl,
          data: indiceData,
          target: this.gl.ELEMENT_ARRAY_BUFFER
        }),
        type: (indiceData instanceof Uint8Array ? this.gl.UNSIGNED_BYTE : (indiceData instanceof Uint16Array ? this.gl.UNSIGNED_SHORT : this.gl.UNSIGNED_INT)),
        offset: 0,
        count: indiceData ? indiceData.length : 0
      }
    }
  }

  bind() {
    for (let attribute of this.attributes.values()) {
      attribute.buffer.bind();
    }
    
    if(this.indices) {
      this.indices.buffer.bind();
    }
  }

  unbind() {
    for (let attribute of this.attributes.values()) {
      attribute.buffer.unbind();
    }

    if(this.indices) {
      this.indices.buffer.unbind();
    }
  }

  draw ({
    mode = this.gl.TRIANGLES, 
    elements = !!this.indices,
    count = elements ? this.indices.count : this.attributes.get("position").count, 
    offset = this.indices ? this.indices.offset : 0,
    type = this.indices ? this.indices.type : null,
    first = 0,
    instanceCount = undefined
  } = {}) {
    if(elements) {
      if(instanceCount !== undefined) {
        this._drawElementsInstanced(mode, count, type, offset, instanceCount);
      } else {
        this.gl.drawElements(mode, count, type, offset);
      }
    } else {
      if(instanceCount !== undefined) {
        this._drawArraysInstanced(mode, first, count, instanceCount);
      } else {
        this.gl.drawArrays(mode, first, count);
      }
    }
  }
};
