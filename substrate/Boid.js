import Particle from "../physics/Particle";

export default class Boid extends Particle {
  constructor(x = 0, y = 0, velocityAngle = Math.random() * Math.PI * 2, offsetAngle = 0, life = Infinity) {
    super(x, y, undefined, undefined, life);
    this.velocityAngle = velocityAngle;
    // this.offsetAngle = offsetAngle;
    return this;
  }

  set (x = this.x, y = this.y, velocityAngle = this.velocityAngle, offsetAngle = this.offsetAngle, life = Infinity) {
    // this.offsetAngle = offsetAngle;
    super.set(x, y, undefined, undefined, life);
    this.velocityAngle = velocityAngle;
    return this;
  }

  set velocityAngle (value) {
    this.velocity.set(Math.cos(value), -Math.sin(value));
    this._velocityAngle = value;
    return value;
  }

  get velocityAngle () {
    return this._velocityAngle;
  }

  reset (x = 0, y = 0, velocityAngle = Math.random() * Math.PI * 2, offsetAngle = 0, life = Infinity) {
    this.set(x, y, velocityAngle, offsetAngle, life);
    this.isDead = false;
    return this;
  }

  update () {
    if (this.isDead) {
      return this;
    }
    // if (this.offsetAngle) {
    //   this._velocityAngle += this.offsetAngle;
    //   this.velocity.x = Math.cos(this.velocityAngle);
    //   this.velocity.y = Math.sin(this.velocityAngle);
    // }
    super.update();
    return this;
  }
}
