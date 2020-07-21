export default class Easing {
  static powerEaseIn(x, power = 2) {
    return Math.pow(x, power);
  }

  static powerEaseOut(x, power = 2) {
    return 1 - Math.abs(Math.pow(x - 1, power));
  }

  static powerEaseInOut(x, power = 2) {
    return x < .5 ? Easing.powerEaseIn(x * 2, power) / 2 : Easing.powerEaseOut(x * 2 - 1, power) / 2 + 0.5;
  }
}
