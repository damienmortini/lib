import { modulo } from './Math.js';
import { random } from './PRNG.js';

export class Noise {
  static noise(x) {
    const fl = Math.floor(x);
    const fc = modulo(x, 1);
    const r1 = random(fl);
    const r2 = random(fl + 1.0);
    return r1 + (r2 - r1) * fc;
  }
}
