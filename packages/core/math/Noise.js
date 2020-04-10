import Math from './Math.js';
import PRNG from './PRNG.js';

export default class Noise {
  static noise(x) {
    const fl = Math.floor(x);
    const fc = Math.modulo(x, 1);
    const r1 = PRNG.random(fl);
    const r2 = PRNG.random(fl + 1.0);
    return r1 + (r2 - r1) * fc;
  }
}
