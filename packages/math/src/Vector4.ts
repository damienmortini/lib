import { vec4 } from 'gl-matrix/esm/index.js'

export class Vector4 extends Float32Array {
  constructor(array = [0, 0, 0, 0]) {
    super(array)
    return this
  }

  get x() {
    return this[0]
  }

  set x(value) {
    this[0] = value
  }

  get y() {
    return this[1]
  }

  set y(value) {
    this[1] = value
  }

  get z() {
    return this[2]
  }

  set z(value) {
    this[2] = value
  }

  get w() {
    return this[3]
  }

  set w(value) {
    this[3] = value
  }

  applyMatrix4(matrix4) {
    vec4.transformMat4(this, this, matrix4)
    return this
  }
}
