import GLBuffer from "./GLBuffer.js";
import GLMesh from "./GLMesh.js";

export default class GLTFMesh extends GLMesh {
  constructor({gl, data} = {}) {
    super({
      gl
    });

    let positionAttributeData = data.primitives[0].attributes["POSITION"];
    this.attributes.set("position", {
      buffer: new GLBuffer({
        gl: this.gl,
        data: positionAttributeData.bufferView.buffer
      }),
      size: 3,
      count: positionAttributeData.count,
      offset: positionAttributeData.bufferView.byteOffset + positionAttributeData.byteOffset,
      stride: positionAttributeData.byteStride,
      target: positionAttributeData.target
    });

    let normalAttributeData = data.primitives[0].attributes["NORMAL"];
    this.attributes.set("normal", {
      buffer: new GLBuffer({
        gl: this.gl,
        data: normalAttributeData.bufferView.buffer
      }),
      size: 3,
      count: normalAttributeData.count,
      offset: normalAttributeData.bufferView.byteOffset + normalAttributeData.byteOffset,
      stride: normalAttributeData.byteStride,
      target: normalAttributeData.target
    });

    let uvAttributeData = data.primitives[0].attributes["TEXCOORD_0"];
    this.attributes.set("uv", {
      buffer: new GLBuffer({
        gl: this.gl,
        data: uvAttributeData.bufferView.buffer
      }),
      size: 2,
      count: uvAttributeData.count,
      offset: uvAttributeData.bufferView.byteOffset + uvAttributeData.byteOffset,
      stride: uvAttributeData.byteStride,
      target: uvAttributeData.target
    });

    let indices = data.primitives[0].indices;

    this.indices.buffer.data = indices.bufferView.buffer;
    this.indices.offset = indices.bufferView.byteOffset;
    this.indices.count = indices.count;
  }
}