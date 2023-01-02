export default class Matrix4 extends Float32Array {
  constructor(array?: number[])
  set x(arg: any)
  get x(): any
  12: any
  set y(arg: any)
  get y(): any
  13: any
  set z(arg: any)
  get z(): any
  14: any
  set w(arg: any)
  get w(): any
  15: any
  set(array: any, offset?: number): Matrix4
  translate(vector3: any, matrix4?: Matrix4): Matrix4
  rotateX(value: any, matrix4?: Matrix4): Matrix4
  rotateY(value: any, matrix4?: Matrix4): Matrix4
  rotateZ(value: any, matrix4?: Matrix4): Matrix4
  scale(value: any, matrix4?: Matrix4): Matrix4
  multiply(matrix4a: any, matrix4b?: any): Matrix4
  identity(): Matrix4
  copy(matrix4: any): Matrix4
  fromTranslationRotationScale(translation?: Float32Array, rotation?: Float32Array, scale?: Float32Array): Matrix4
  fromPerspective(fov: any, aspectRatio: any, near: any, far: any): Matrix4
  fromQuaternion(quaternion: any): Matrix4
  setPosition(vector3: any): Matrix4
  invert(matrix4?: Matrix4): Matrix4
  transpose(matrix4?: Matrix4): Matrix4
  lookAt(eye: any, center: any, up: any): Matrix4
  targetTo(eye: any, center: any, up: any): Matrix4
}
