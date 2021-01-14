import Matrix4 from '../math/Matrix4.js';

export default class GLTFSkin {
  constructor({
    data,
  }) {
    this.name = data.name;
    this.joints = data.joints;

    this._jointMatrices = [];
    this._jointNormalMatrices = [];
    for (let index = 0; index < this.joints.length; index++) {
      this._jointMatrices.push(new Matrix4(this.joints[index].transform));
      this._jointNormalMatrices.push(new Matrix4());
    }

    const bufferView = data.inverseBindMatrices.bufferView;
    this.inverseBindMatrices = new Float32Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength / Float32Array.BYTES_PER_ELEMENT);

    let width = Math.max(4, Math.pow(2, Math.ceil(Math.log(Math.sqrt(this.joints.length * 4)) / Math.LN2)));
    const height = Math.pow(2, Math.ceil(Math.log(this.joints.length * 4 / width) / Math.LN2));
    width *= 2;
    this.jointMatricesTextureData = new Float32Array(width * height * 4);
    this.jointMatricesTextureSize = [width, height];

    this.updateJointsTextureData();
  }

  updateJointsTextureData() {
    for (let index = 0; index < this._jointMatrices.length; index++) {
      const jointMatrix = this._jointMatrices[index];
      jointMatrix.multiply(this.joints[index].worldTransform, this.inverseBindMatrices.slice(index * 16, index * 16 + 16));

      const normalMatrix = this._jointNormalMatrices[index];
      normalMatrix.invert(jointMatrix);
      normalMatrix.transpose();

      this.jointMatricesTextureData.set(this._jointMatrices[index], index * 32);
      this.jointMatricesTextureData.set(this._jointNormalMatrices[index], index * 32 + 16);
    }
  }
}
