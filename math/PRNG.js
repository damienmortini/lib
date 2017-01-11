import Math from "./Math.js";

export default class PRNG {
  static random(x) {
    return Math.modulo(Math.sin(x) * 43758.5453123, 1);
  }
}
