import * as mat4 from '../../../gl-matrix/esm/mat4.js';

const TRANSLATION_IDENTITY = new Float32Array(3);
const ROTATION_IDENTITY = new Float32Array([0, 0, 0, 1]);
const SCALE_IDENTITY = new Float32Array([1, 1, 1]);

export default class Matrix4 extends Float32Array {
  constructor(array = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) {
    super(array);
    return this;
  }

  set x(value) {
    this[12] = value;
  }

  get x() {
    return this[12];
  }

  set y(value) {
    this[13] = value;
  }

  get y() {
    return this[13];
  }

  set z(value) {
    this[14] = value;
  }

  get z() {
    return this[14];
  }

  set w(value) {
    this[15] = value;
  }

  get w() {
    return this[15];
  }

  set(array, offset = 0) {
    super.set(array, offset);
    return this;
  }

  translate(vector3, matrix4 = this) {
    mat4.translate(this, matrix4, vector3);
    return this;
  }

  rotateX(value, matrix4 = this) {
    mat4.rotateX(this, matrix4, value);
    return this;
  }

  rotateY(value, matrix4 = this) {
    mat4.rotateY(this, matrix4, value);
    return this;
  }

  rotateZ(value, matrix4 = this) {
    mat4.rotateZ(this, matrix4, value);
    return this;
  }

  scale(value, matrix4 = this) {
    mat4.scale(this, matrix4, typeof value === 'number' ? [value, value, value] : value);
    return this;
  }

  multiply(matrix4a, matrix4b = undefined) {
    if (matrix4b) {
      mat4.multiply(this, matrix4a, matrix4b);
    } else {
      mat4.multiply(this, this, matrix4a);
    }
    return this;
  }

  identity() {
    mat4.identity(this);
    return this;
  }

  copy(matrix4) {
    mat4.copy(this, matrix4);
    return this;
  }

  fromTranslationRotationScale(translation = TRANSLATION_IDENTITY, rotation = ROTATION_IDENTITY, scale = SCALE_IDENTITY) {
    mat4.fromRotationTranslationScale(this, rotation, translation, scale);
    return this;
  }

  fromPerspective(fov, aspectRatio, near, far) {
    mat4.perspective(this, fov, aspectRatio, near, far);
    return this;
  }

  fromQuaternion(quaternion) {
    mat4.fromQuat(this, quaternion);
    return this;
  }

  setPosition(vector3) {
    this.x = vector3[0];
    this.y = vector3[1];
    this.z = vector3[2];
    return this;
  }

  invert(matrix4 = this) {
    mat4.invert(this, matrix4);
    return this;
  }

  transpose(matrix4 = this) {
    mat4.transpose(this, matrix4);
    return this;
  }

  lookAt(eye, center, up) {
    mat4.lookAt(this, eye, center, up);
    return this;
  }

  targetTo(eye, center, up) {
    mat4.targetTo(this, eye, center, up);
    return this;
  }
}
