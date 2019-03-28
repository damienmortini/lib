import GLBuffer from "./GLBuffer.js";
import GLMesh from "./GLMesh.js";
import GLVertexAttribute from "./GLVertexAttribute.js";

export default class GLTFMesh extends GLMesh {
  constructor({
    gl,
    data,
    attributes = undefined,
    uvs = true,
  }) {
    super({
      gl,
      attributes,
    });

    const positionAttributeData = data.primitives[0].attributes["POSITION"];
    this.attributes.set("position", {
      buffer: new GLBuffer({
        gl: this.gl,
        data: positionAttributeData.bufferView.buffer,
      }),
      size: 3,
      count: positionAttributeData.count,
      offset: positionAttributeData.bufferView.byteOffset,
      target: positionAttributeData.bufferView.target,
    });

    const normalAttributeData = data.primitives[0].attributes["NORMAL"];
    this.attributes.set("normal", {
      buffer: new GLBuffer({
        gl: this.gl,
        data: normalAttributeData.bufferView.buffer,
      }),
      size: 3,
      count: normalAttributeData.count,
      offset: normalAttributeData.bufferView.byteOffset,
      target: normalAttributeData.bufferView.target,
    });

    const uvAttributeData = data.primitives[0].attributes["TEXCOORD_0"];
    if (uvs && uvAttributeData) {
      this.attributes.set("uv", {
        buffer: new GLBuffer({
          gl: this.gl,
          data: uvAttributeData.bufferView.buffer,
        }),
        size: 2,
        count: uvAttributeData.count,
        offset: uvAttributeData.bufferView.byteOffset,
        target: uvAttributeData.bufferView.target,
      });
    }

    const indices = data.primitives[0].indices;

    if (indices) {
      this.indices = new GLVertexAttribute({
        gl: this.gl,
        buffer: new GLBuffer({
          gl: this.gl,
          data: indices.bufferView.buffer,
          target: this.gl.ELEMENT_ARRAY_BUFFER,
        }),
        type: indices.componentType,
        offset: indices.bufferView.byteOffset,
        count: indices.count,
      });
    }
  }
}
