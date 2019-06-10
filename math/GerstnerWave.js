import Vector2 from "./Vector2.js";

const POSITION = new Vector2();

export default class GerstnerWave {
  static compute({
    x = 0,
    y = 0,
    direction = [1, 0],
    steepness = 1,
    wavelength = 1,
    time = 0,
  }) {
    POSITION.set(x, y);
    const wavenumber = 2. * Math.PI / wavelength;
    const speed = Math.sqrt(9.8 / wavenumber);
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
}
