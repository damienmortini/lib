export default class Easing {
  static powerIn(x, power = 2) {
    return Math.pow(x, power);
  }

  static powerOut(x, power = 2) {
    return 1 - Math.abs(Math.pow(x - 1, power));
  }

  static powerInOut(x, power = 2) {
    return x < .5 ? Easing.powerIn(x * 2, power) / 2 : Easing.powerOut(x * 2 - 1, power) / 2 + 0.5;
  }

  static backIn(x, power = 1.7) {
    return (1 + power) * x * x * x - power * x * x;
  }

  static backOut(x, power = 1.7) {
    return 1 + (1 + power) * Math.pow(x - 1, 3) + power * Math.pow(x - 1, 2);
  }

  static backInOut(x, power = 1.7) {
    return x < .5 ? Easing.backIn(x * 2, power) / 2 : Easing.backOut(x * 2 - 1, power) / 2 + 0.5;
  }
}
