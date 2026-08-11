import { mat4 } from 'gl-matrix/esm/index.js';

const TRANSLATION_IDENTITY = new Float32Array(3);
const ROTATION_IDENTITY = new Float32Array([0, 0, 0, 1]);
const SCALE_IDENTITY = new Float32Array([1, 1, 1]);

export class Matrix4 extends Float32Array {
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
    }
    else {
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
    mat4.fromRotationTranslationScale(this, rotation, translation, typeof scale === 'number' ? [scale, scale, scale] : scale);
    return this;
  }

  // GL/[-1,1] NDC depth range, via gl-matrix. Never feed this to WebGPU — use
  // fromOffAxisFrustum (with a symmetric rect if you want a plain perspective) instead.
  fromPerspective(fov, aspectRatio, near, far) {
    mat4.perspective(this, fov, aspectRatio, near, far);
    return this;
  }

  // gl-matrix's mat4.frustum() targets the GL/[-1,1] NDC depth range; WebGPU
  // (and D3D) expect [0,1], so this reimplements the asymmetric frustum with
  // that depth range instead of composing with gl-matrix's frustum/perspective.
  fromOffAxisFrustum(left, right, bottom, top, near, far) {
    const rl = 1 / (right - left);
    const tb = 1 / (top - bottom);
    const nf = 1 / (near - far);
    this[0] = 2 * near * rl;
    this[1] = 0;
    this[2] = 0;
    this[3] = 0;
    this[4] = 0;
    this[5] = 2 * near * tb;
    this[6] = 0;
    this[7] = 0;
    this[8] = (right + left) * rl;
    this[9] = (top + bottom) * tb;
    this[10] = far * nf;
    this[11] = -1;
    this[12] = 0;
    this[13] = 0;
    this[14] = far * near * nf;
    this[15] = 0;
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
