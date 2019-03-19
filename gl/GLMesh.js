import GLBuffer from "./GLBuffer.js";
import GLVertexAttribute from "./GLVertexAttribute.js";

export default class GLMesh {
  constructor({
    gl,
    positions = undefined,
    normals = undefined,
    uvs = undefined,
    attributes = {},
    indices = undefined,
  } = { gl }) {
    this.gl = gl;

    this.gl.getExtension("OES_element_index_uint");

    this._drawElementsInstanced = () => { };
    this._drawArraysInstanced = () => { };
    const instancedArraysExtension = this.gl.getExtension("ANGLE_instanced_arrays");
    if (instancedArraysExtension) {
      this._drawElementsInstanced = instancedArraysExtension.drawElementsInstancedANGLE.bind(instancedArraysExtension);
      this._drawArraysInstanced = instancedArraysExtension.drawArraysInstancedANGLE.bind(instancedArraysExtension);
    } else if (this.gl.drawElementsInstanced) {
      this._drawElementsInstanced = this.gl.drawElementsInstanced.bind(this.gl);
      this._drawArraysInstanced = this.gl.drawArraysInstanced.bind(this.gl);
    }

    this.attributes = new Map(attributes.entries ? attributes : Object.entries(attributes));

    if (positions) {
      this.attributes.set("position", new GLVertexAttribute({
        gl,
        data: positions,
        size: 3,
      }));
    }

    if (normals) {
      this.attributes.set("normal", new GLVertexAttribute({
        gl,
        data: normals,
        size: 3,
      }));
    }

    if (uvs) {
      this.attributes.set("uv", new GLVertexAttribute({
        gl,
        data: uvs,
        size: 2,
      }));
    }

    for (const [key, value] of this.attributes) {
      if (!(value instanceof GLVertexAttribute)) {
        this.attributes.set(key, new GLVertexAttribute(Object.assign({ gl }, value)));
      }
    }

    if (indices && !(this.indices instanceof GLVertexAttribute)) {
      this.indices = new GLVertexAttribute(Object.assign({
        gl: this.gl,
        buffer: new GLBuffer({
          gl: this.gl,
          target: this.gl.ELEMENT_ARRAY_BUFFER,
        }),
      }, indices.length !== undefined ? { data: indices } : indices));
    }
  }

  draw({
    mode = this.gl.TRIANGLES,
    elements = !!this.indices,
    count = elements ? this.indices.count : this.attributes.get("position").count,
    offset = this.indices ? this.indices.offset : 0,
    type = elements ? this.indices.type : null,
    first = 0,
    instanceCount = undefined,
  } = {}) {
    if (elements) {
      if (instanceCount !== undefined) {
        this._drawElementsInstanced(mode, count, type, offset, instanceCount);
      } else {
        this.gl.drawElements(mode, count, type, offset);
      }
    } else {
      if (instanceCount !== undefined) {
        this._drawArraysInstanced(mode, first, count, instanceCount);
      } else {
        this.gl.drawArrays(mode, first, count);
      }
    }
  }
}
