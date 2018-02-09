import GLBuffer from "./GLBuffer.js";
import GLAttribute from "./GLAttribute.js";

export default class GLMesh {
  constructor({
    gl = undefined, 
    attributes = undefined, 
    indiceData = undefined
  } = {}) {
    this.gl = gl;

    this.gl.getExtension("OES_element_index_uint");

    this._drawElementsInstanced = function() {};
    this._drawArraysInstanced = function() {};
    const instancedArraysExtension = this.gl.getExtension("ANGLE_instanced_arrays");
    if(instancedArraysExtension) {
      this._drawElementsInstanced = instancedArraysExtension.drawElementsInstancedANGLE.bind(instancedArraysExtension);
      this._drawArraysInstanced = instancedArraysExtension.drawArraysInstancedANGLE.bind(instancedArraysExtension);
    } else if(this.gl.drawElementsInstanced) {
      this._drawElementsInstanced = this.gl.drawElementsInstanced.bind(this.gl);
      this._drawArraysInstanced = this.gl.drawArraysInstanced.bind(this.gl);
    }

    this.attributes = new Map(attributes);
    
    if(indiceData) {
      this.indices = new GLAttribute({
        gl: this.gl,
        buffer: new GLBuffer({
          gl: this.gl,
          data: indiceData,
          target: this.gl.ELEMENT_ARRAY_BUFFER
        })
      });
    }
  }

  draw ({
    mode = this.gl.TRIANGLES, 
    elements = !!this.indices,
    count = elements ? this.indices.count : this.attributes.get("position").count, 
    offset = this.indices ? this.indices.offset : 0,
    type = elements ? this.indices.type : null,
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
