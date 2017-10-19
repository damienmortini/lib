export default class CSSTimingFunction {
  static all() {
    return `
      ${CSSTimingFunction.quad()}
      ${CSSTimingFunction.cubic()}
      ${CSSTimingFunction.quart()}
      ${CSSTimingFunction.quint()}
      ${CSSTimingFunction.sine()}
      ${CSSTimingFunction.expo()}
      ${CSSTimingFunction.circ()}
      ${CSSTimingFunction.back()}
    `;
  }

  static quad() {
    return `
      --ease-in-quad: ${CSSTimingFunction.easeInQuad()};
      --ease-out-quad: ${CSSTimingFunction.easeOutQuad()};
      --ease-in-out-quad: ${CSSTimingFunction.easeInOutQuad()};
    `;
  }

  static easeInQuad() {
    return "cubic-bezier(0.550, 0.085, 0.680, 0.530)";
  }

  static easeOutQuad() {
    return "cubic-bezier(0.250, 0.460, 0.450, 0.940)";
  }

  static easeInOutQuad() {
    return "cubic-bezier(0.455, 0.030, 0.515, 0.955)";
  }

  static cubic() {
    return `
      --ease-in-cubic: ${CSSTimingFunction.easeInCubic()};
      --ease-out-cubic: ${CSSTimingFunction.easeOutCubic()};
      --ease-in-out-cubic: ${CSSTimingFunction.easeInOutCubic()};
    `;
  }

  static easeInCubic() {
    return "cubic-bezier(0.550, 0.055, 0.675, 0.190)";
  }

  static easeOutCubic() {
    return "cubic-bezier(0.215, 0.610, 0.355, 1.000)";
  }

  static easeInOutCubic() {
    return "cubic-bezier(0.645, 0.045, 0.355, 1.000)";
  }

  static quart() {
    return `
      --ease-in-quart: ${CSSTimingFunction.easeInQuart()};
      --ease-out-quart: ${CSSTimingFunction.easeOutQuart()};
      --ease-in-out-quart: ${CSSTimingFunction.easeInOutQuart()};
    `;
  }

  static easeInQuart() {
    return "cubic-bezier(0.895, 0.030, 0.685, 0.220)";
  }

  static easeOutQuart() {
    return "cubic-bezier(0.165, 0.840, 0.440, 1.000)";
  }

  static easeInOutQuart() {
    return "cubic-bezier(0.770, 0.000, 0.175, 1.000)";
  }

  static quint() {
    return `
      --ease-in-quint: ${CSSTimingFunction.easeInQuint()};
      --ease-out-quint: ${CSSTimingFunction.easeOutQuint()};
      --ease-in-out-quint: ${CSSTimingFunction.easeInOutQuint()};
    `;
  }

  static easeInQuint() {
    return "cubic-bezier(0.755, 0.050, 0.855, 0.060)";
  }

  static easeOutQuint() {
    return "cubic-bezier(0.230, 1.000, 0.320, 1.000)";
  }

  static easeInOutQuint() {
    return "cubic-bezier(0.860, 0.000, 0.070, 1.000)";
  }

  static sine() {
    return `
      --ease-in-sine: ${CSSTimingFunction.easeInSine()};
      --ease-out-sine: ${CSSTimingFunction.easeOutSine()};
      --ease-in-out-sine: ${CSSTimingFunction.easeInOutSine()};
    `;
  }

  static easeInSine() {
    return "cubic-bezier(0.470, 0.000, 0.745, 0.715)";
  }

  static easeOutSine() {
    return "cubic-bezier(0.390, 0.575, 0.565, 1.000)";
  }

  static easeInOutSine() {
    return "cubic-bezier(0.445, 0.050, 0.550, 0.950)";
  }

  static expo() {
    return `
      --ease-in-expo: ${CSSTimingFunction.easeInExpo()};
      --ease-out-expo: ${CSSTimingFunction.easeOutExpo()};
      --ease-in-out-expo: ${CSSTimingFunction.easeInOutExpo()};
    `;
  }

  static easeInExpo() {
    return "cubic-bezier(0.950, 0.050, 0.795, 0.035)";
  }

  static easeOutExpo() {
    return "cubic-bezier(0.190, 1.000, 0.220, 1.000)";
  }

  static easeInOutExpo() {
    return "cubic-bezier(1.000, 0.000, 0.000, 1.000)";
  }

  static circ() {
    return `
      --ease-in-circ: ${CSSTimingFunction.easeInCirc()};
      --ease-out-circ: ${CSSTimingFunction.easeOutCirc()};
      --ease-in-out-circ: ${CSSTimingFunction.easeInOutCirc()};
    `;
  }

  static easeInCirc() {
    return "cubic-bezier(0.600, 0.040, 0.980, 0.335)";
  }

  static easeOutCirc() {
    return "cubic-bezier(0.075, 0.820, 0.165, 1.000)";
  }

  static easeInOutCirc() {
    return "cubic-bezier(0.785, 0.135, 0.150, 0.860)";
  }

  static back() {
    return `
      --ease-in-back: ${CSSTimingFunction.easeInBack()};
      --ease-out-back: ${CSSTimingFunction.easeOutBack()};
      --ease-in-out-back: ${CSSTimingFunction.easeInOutBack()};
    `;
  }

  static easeInBack() {
    return "cubic-bezier(0.600, -0.280, 0.735, 0.045)";
  }

  static easeOutBack() {
    return "cubic-bezier(0.175, 0.885, 0.320, 1.275)";
  }

  static easeInOutBack() {
    return "cubic-bezier(0.680, -0.550, 0.265, 1.550)";
  }
}