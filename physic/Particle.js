import Vector2 from "../math/Vector2.js";
import Vector3 from "../math/Vector3.js";

export default class Particle {
  constructor({
    position = new Vector3(),
    velocity = position instanceof Vector2 ? new Vector2() : new Vector3(),
    life = Infinity
  } = {}) {
    this.position = position;
    this.velocity = velocity;
    this.life = life;
    this.reset();
    return this;
  }

  get x() {
    return this.position.x;
  }

  set x(value) {
    this.position.x = value;
  }

  get y() {
    return this.position.y;
  }

  set y(value) {
    this.position.y = value;
  }

  get z() {
    return this.position.z;
  }

  set z(value) {
    this.position.z = value;
  }

  set({position = this.position, life = this.life} = {}) {
    this.position.copy(position);
    this.life = life;
    return this;
  }

  reset({position, life} = {}) {
    this.set({
      position,
      life
    });
    this.currentLife = this.life;
    this.dead = false;
    return this;
  }

  copy(particle) {
    this.position.copy(particle.position);
    this.velocity.copy(particle.velocity);
    this.life = particle.life;
    this.currentLife = particle.currentLife;
    this.dead = particle.dead;
  }

  update() {
    if (this.dead) {
      return this;
    }
    this.position.add(this.velocity);
    this.currentLife--;
    if (this.currentLife < 1) {
      this.dead = true;
    }
    return this;
  }
}
