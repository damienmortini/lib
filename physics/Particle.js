import Vector2 from "../math/Vector2";

export default class Particle extends Vector2 {
  constructor(x = 0, y = 0, velocityX = 0, velocityY = 0, life = Infinity) {
    super(x, y);
    this.velocity = new Vector2(velocityX, velocityY);
    this.life = life;
    this.currentLife = this.life;
    this.isDead = false;
    return this;
  }

  set (x = this.x, y = this.y, velocityX = this.velocity.x, velocityY = this.velocity.y, life = this.life) {
    super.set(x, y);
    this.velocity.set(velocityX, velocityY);
    this.life = life;
    return this;
  }

  reset (x = this.x, y = this.y, velocityX = this.velocity.x, velocityY = this.velocity.y, life = this.life) {
    this.set(...arguments);
    this.currentLife = this.life;
    this.isDead = false;
    return this;
  }

  kill () {
    this.isDead = true;
  }

  update () {
    if (this.isDead) {
      return this;
    }
    this.add(this.velocity);
    this.currentLife--;
    if(this.currentLife === 0) {
      this.kill();
    }
    return this;
  }
}
