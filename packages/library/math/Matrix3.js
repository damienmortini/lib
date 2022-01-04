import { mat3 } from 'gl-matrix'

export default class Matrix3 extends Float32Array {
  constructor(array = [1, 0, 0, 0, 1, 0, 0, 0, 1]) {
    super(array)
    return this
  }

  set x(value) {
    this[6] = value
  }

  get x() {
    return this[6]
  }

  set y(value) {
    this[7] = value
  }

  get y() {
    return this[7]
  }

  set z(value) {
    this[8] = value
  }

  get z() {
    return this[8]
  }

  set(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    mat3.set(this, m00, m01, m02, m10, m11, m12, m20, m21, m22)
    return this
  }

  translate(vector2, matrix3 = this) {
    mat3.translate(this, matrix3, vector2)
    return this
  }

  rotate(value, matrix3 = this) {
    mat3.rotate(this, matrix3, value)
    return this
  }

  scale(vector2, matrix3 = this) {
    mat3.scale(this, matrix3, vector2)
    return this
  }

  multiply(matrix3a, matrix3b) {
    if (matrix3b) {
      mat3.multiply(this, matrix3a, matrix3b)
    } else {
      mat3.multiply(this, this, matrix3a)
    }
    return this
  }

  identity() {
    mat3.identity(this)
    return this
  }

  copy(matrix3) {
    mat3.copy(this, matrix3)
    return this
  }

  fromMatrix4(matrix4) {
    mat3.fromMat4(this, matrix4)
    return this
  }

  fromQuaternion(quaternion) {
    mat3.fromQuat(this, quaternion)
    return this
  }

  fromBasis(vector3a, vector3b, vector3c) {
    this.set(vector3a[0], vector3a[1], vector3a[2], vector3b[0], vector3b[1], vector3b[2], vector3c[0], vector3c[1], vector3c[2])
    return this
  }

  normalMatrixFromTransform(matrix4) {
    mat3.normalFromMat4(this, matrix4)
    return this
  }

  invert(matrix3 = this) {
    mat3.invert(this, matrix3)
    return this
  }
}
