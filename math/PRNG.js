import { modulo } from "./Math.js";

export default class PRNG {
  static random(x) {
    return modulo(Math.sin(x) * 43758.5453123, 1);
  }
}
