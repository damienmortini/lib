import Vector3 from "../math/Vector3.js";

export default class Particle {
  constructor({x = 0, y = 0, z = 0, life = Infinity} = {}) {
    this.position = new Vector3();
    this.velocity = new Vector3();
    this.reset({x, y, z, life});
    return this;
  }

  set ({x = this.x, y = this.y, z = this.z, life = this.life} = {}) {
    this.position.set(x, y, z);
    this.life = life;
    return this;
  }

  reset ({x, y, z, life} = {}) {
    this.set({x, y, z, life});
    this.currentLife = this.life;
    this.dead = false;
    return this;
  }

  copy (particle) {
    this.position.copy(particle.position);
    this.velocity.copy(particle.velocity);
    this.life = particle.life;
    this.currentLife = particle.currentLife;
    this.dead = particle.dead;
  }

  update () {
    if (this.dead) {
      return this;
    }
    this.position.add(this.velocity);
    this.currentLife--;
    if(this.currentLife < 1) {
      this.dead = true;
    }
    return this;
  }
}
