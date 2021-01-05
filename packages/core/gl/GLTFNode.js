import Matrix4 from '../math/Matrix4.js';
import Quaternion from '../math/Quaternion.js';
import GLObject from './GLObject.js';

const QUATERNION = new Quaternion();
const MATRIX4 = new Matrix4();

export default class GLTFNode {
  constructor({
    gl,
    data,
  }) {
    this.name = data.name;
    this.transform = new Matrix4();

    if (data.translation) {
      this.transform.translate(data.translation);
    }

    if (data.rotation) {
      QUATERNION.copy(data.rotation);
      MATRIX4.fromQuaternion(QUATERNION);
      this.transform.multiply(MATRIX4);
    }

    if (data.scale) {
      this.transform.scale(data.scale);
    }

    if (data.mesh) {
      this._object = new GLObject({
        gl,
        mesh: data.mesh,
      });
    }
  }
}
