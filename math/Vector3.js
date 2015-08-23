export default class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  get length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(vector3) {
    this.x = vector3.x;
    this.y = vector3.y;
    this.z = vector3.z;
    return this;
  }

  add(vector3) {
    this.x += vector3.x;
    this.y += vector3.y;
    this.z += vector3.z;
    return this;
  }

  normalize() {
    this.divideScalar(this.length);
  }

  divideScalar(scalar) {
    if (scalar !== 0) {
      let invScalar = 1 / scalar;
      this.x *= invScalar;
      this.y *= invScalar;
      this.z *= invScalar;
    } else {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }
    return this;
  }

  dot(vector3) {
    return this.x * vector3.x + this.y * vector3.y + this.z * vector3.z;
  }

  angleTo(vector3) {
    // TODO: To test(from three.js)
    let theta = this.dot(vector3) / (this.length() * vector3.length());
    return Math.acos((theta < -1) ? -1 : ((theta > 1) ? 1 : theta));
  }
}
