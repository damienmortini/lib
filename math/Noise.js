import Math from "./Math.js";
import PRNG from "./PRNG.js";

export default class Noise {
  static noise(x) {
    let fl = Math.floor(x);
    let fc = Math.modulo(x, 1);
    let r1 = PRNG.random(fl);
    let r2 = PRNG.random(fl + 1.0);
    return r1 + (r2 - r1) * fc;
  }
}
