import { Matrix4 } from './Matrix4.js';
import { Vector3 } from './Vector3.js';

const MATRIX4 = new Matrix4();

export class Ray {
  origin = new Vector3();
  direction = new Vector3();

  setFromCamera(camera, position = [0, 0]) {
    this.origin.x = camera.transform.x;
    this.origin.y = camera.transform.y;
    this.origin.z = camera.transform.z;

    this.direction.set([position[0], position[1], 1]);
    MATRIX4.invert(camera.projection);
    this.direction.applyMatrix4(MATRIX4);
    this.direction.applyMatrix4(camera.transform);
    this.direction.subtract(this.origin);
    this.direction.normalize();

    return this;
  }
}
