import Matrix4 from '../math/Matrix4.js';
import Quaternion from '../math/Quaternion.js';
import Vector3 from '../math/Vector3.js';

const QUATERNION = new Quaternion();
const MATRIX4 = new Matrix4();

export default class GLTFNode {
  constructor({
    gl,
    data,
  }) {
    this.name = data.name;
    this.children = data.children || [];
    this.skin = data.skin;
    this.mesh = data.mesh;
    this.scale = new Vector3(data.scale ?? [1, 1, 1]);
    this.rotation = new Quaternion(data.rotation);
    this.translation = new Vector3(data.translation);
    this.matrix = new Matrix4(data.matrix);
    if (!data.matrix) {
      this.updateMatrix();
    }
  }

  updateMatrix() {
    this.matrix.scale(this.scale);

    QUATERNION.copy(this.rotation);
    MATRIX4.fromQuaternion(QUATERNION);
    this.matrix.multiply(MATRIX4);

    this.matrix.x = this.translation[0];
    this.matrix.y = this.translation[1];
    this.matrix.z = this.translation[2];
  }

  draw(...args) {
    if (!this.mesh) return;
    this.mesh.draw(...args);
  }

  updateSkin() {
    if (!this.skin || !this.mesh) {
      return;
    }
    this.mesh.updateSkin(this.skin);
  }
}
