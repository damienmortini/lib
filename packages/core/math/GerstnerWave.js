import Vector2 from './Vector2.js';

const POSITION = new Vector2();

export default class GerstnerWave {
  static compute({
    x = 0,
    y = 0,
    time = 0,
    direction = [1, 0],
    steepness = 1,
    wavelength = 1,
    speed = Math.sqrt(9.8 / (2. * Math.PI / wavelength)),
  }) {
    POSITION.set(x, y);

    const wavenumber = 2. * Math.PI / wavelength;
    const amplitude = steepness / wavenumber;

    const f = wavenumber * (POSITION.dot(direction) - speed * time);

    const cosf = Math.cos(f);
    const sinf = Math.sin(f);

    return [
      amplitude * direction[0] * cosf,
      amplitude * sinf,
      amplitude * direction[1] * cosf,
    ];
  }

  constructor({
    direction = [1, 0],
    steepness = 1,
    wavelength = 1,
    speed = Math.sqrt(9.8 / (2. * Math.PI / wavelength)),
  }) {
    this.direction = direction;
    this.steepness = steepness;
    this.wavelength = wavelength;
    this.speed = speed;
  }

  get wavenumber() {
    return 2 * Math.PI / this.wavelength;
  }
}
