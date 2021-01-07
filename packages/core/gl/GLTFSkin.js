import GLTexture from './GLTexture.js';

export default class GLTFSkin {
  constructor({
    gl,
    data,
  }) {
    this.name = data.name;
    this.joints = data.joints;

    const bufferView = data.inverseBindMatrices.bufferView;
    this.inverseBindMatrices = new Float32Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength / Float32Array.BYTES_PER_ELEMENT);

    const width = Math.max(4, Math.pow(2, Math.ceil(Math.log(Math.sqrt(this.joints.length * 4)) / Math.LN2)));
    const height = Math.pow(2, Math.ceil(Math.log(this.joints.length * 4 / width) / Math.LN2));
    this.jointInverseBindMatricesTexture = new GLTexture({
      gl,
      data: new Float32Array(this.inverseBindMatrices),
      autoGenerateMipmap: false,
      type: gl.FLOAT,
      internalFormat: gl.RGBA32F || gl.RGBA,
      width,
      height,
    });

    this.updateJointsTexture();
  }

  updateJointsTexture() {
    const data = this.jointInverseBindMatricesTexture.data;
    for (let index = 0; index < this.joints.length; index++) {
      data.set(this.joints[index].transform, index * 16);
    }
    this.jointInverseBindMatricesTexture.data = data;
  }
}
