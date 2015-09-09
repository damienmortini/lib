import Vector2 from "../math/Vector2.js";

export default class Particle {
  constructor(x = 0, y = 0, life = Infinity) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2();
    this.life = life;
    this.currentLife = this.life;
    this._isDead = false;
    return this;
  }

  get isDead () {
    return this._isDead;
  }

  set (x = this.x, y = this.y, life = this.life) {
    this.position.set(x, y);
    this.life = life;
    return this;
  }

  reset (x = this.x, y = this.y, life = this.life) {
    this.set(...arguments);
    this.currentLife = this.life;
    this._isDead = false;
    return this;
  }

  copy (particle) {
    this.position.copy(particle.position);
    this.velocity.copy(particle.velocity);
    this.life = particle.life;
    this.currentLife = particle.currentLife;
    this._isDead = particle.isDead;
  }

  kill () {
    this._isDead = true;
  }

  relive () {
    this._isDead = false;
  }

  update () {
    if (this._isDead) {
      return this;
    }
    this.position.add(this.velocity);
    this.currentLife--;
    if(this.currentLife < 1) {
      this.kill();
    }
    return this;
  }
}
