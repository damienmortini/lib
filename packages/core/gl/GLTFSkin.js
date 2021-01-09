import Matrix4 from '../math/Matrix4.js';
import GLTexture from './GLTexture.js';

export default class GLTFSkin {
  constructor({
    gl,
    data,
  }) {
    this.name = data.name;
    this.joints = data.joints;

    this.jointMatrices = [];
    this.jointNormalMatrices = [];
    for (let index = 0; index < this.joints.length; index++) {
      this.jointMatrices.push(new Matrix4(this.joints[index].transform));
      this.jointNormalMatrices.push(new Matrix4());
    }

    const bufferView = data.inverseBindMatrices.bufferView;
    this.inverseBindMatrices = new Float32Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength / Float32Array.BYTES_PER_ELEMENT);

    let width = Math.max(4, Math.pow(2, Math.ceil(Math.log(Math.sqrt(this.joints.length * 4)) / Math.LN2)));
    const height = Math.pow(2, Math.ceil(Math.log(this.joints.length * 4 / width) / Math.LN2));
    width *= 2;
    this._jointMatricesData = new Float32Array(width * height * 4);
    this.jointMatricesTextureSize = [width, height];
    this.jointMatricesTexture = new GLTexture({
      gl,
      data: this._jointMatricesData,
      autoGenerateMipmap: false,
      type: gl.FLOAT,
      internalFormat: gl.RGBA32F || gl.RGBA,
      minFilter: gl.NEAREST,
      magFilter: gl.NEAREST,
      width,
      height,
      flipY: false,
    });

    this.updateJointsTexture();
  }

  updateJointMatrix(index, jointWorldTransform) {
    const jointMatrix = this.jointMatrices[index];
    jointMatrix.multiply(jointWorldTransform, this.inverseBindMatrices.slice(index * 16, index * 16 + 16));

    const normalMatrix = this.jointNormalMatrices[index];
    normalMatrix.invert(jointMatrix);
    normalMatrix.transpose();
  }

  updateJointsTexture() {
    const data = this.jointMatricesTexture.data;
    for (let index = 0; index < this.jointMatrices.length; index++) {
      data.set(this.jointMatrices[index], index * 32);
      data.set(this.jointNormalMatrices[index], index * 32 + 16);
    }
    this.jointMatricesTexture.data = data;
  }
}
