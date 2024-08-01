export default class CSSTimingFunction {
  static get all() {
    return `
      ${CSSTimingFunction.quad}
      ${CSSTimingFunction.cubic}
      ${CSSTimingFunction.quart}
      ${CSSTimingFunction.quint}
      ${CSSTimingFunction.sine}
      ${CSSTimingFunction.expo}
      ${CSSTimingFunction.circ}
      ${CSSTimingFunction.back}
    `;
  }

  static get quad() {
    return `
      --ease-in-quad: ${CSSTimingFunction.easeInQuad};
      --ease-out-quad: ${CSSTimingFunction.easeOutQuad};
      --ease-in-out-quad: ${CSSTimingFunction.easeInOutQuad};
    `;
  }

  static get easeInQuad() {
    return 'cubic-bezier(0.550, 0.085, 0.680, 0.530)';
  }

  static get easeOutQuad() {
    return 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';
  }

  static get easeInOutQuad() {
    return 'cubic-bezier(0.455, 0.030, 0.515, 0.955)';
  }

  static get cubic() {
    return `
      --ease-in-cubic: ${CSSTimingFunction.easeInCubic};
      --ease-out-cubic: ${CSSTimingFunction.easeOutCubic};
      --ease-in-out-cubic: ${CSSTimingFunction.easeInOutCubic};
    `;
  }

  static get easeInCubic() {
    return 'cubic-bezier(0.550, 0.055, 0.675, 0.190)';
  }

  static get easeOutCubic() {
    return 'cubic-bezier(0.215, 0.610, 0.355, 1.000)';
  }

  static get easeInOutCubic() {
    return 'cubic-bezier(0.645, 0.045, 0.355, 1.000)';
  }

  static get quart() {
    return `
      --ease-in-quart: ${CSSTimingFunction.easeInQuart};
      --ease-out-quart: ${CSSTimingFunction.easeOutQuart};
      --ease-in-out-quart: ${CSSTimingFunction.easeInOutQuart};
    `;
  }

  static get easeInQuart() {
    return 'cubic-bezier(0.895, 0.030, 0.685, 0.220)';
  }

  static get easeOutQuart() {
    return 'cubic-bezier(0.165, 0.840, 0.440, 1.000)';
  }

  static get easeInOutQuart() {
    return 'cubic-bezier(0.770, 0.000, 0.175, 1.000)';
  }

  static get quint() {
    return `
      --ease-in-quint: ${CSSTimingFunction.easeInQuint};
      --ease-out-quint: ${CSSTimingFunction.easeOutQuint};
      --ease-in-out-quint: ${CSSTimingFunction.easeInOutQuint};
    `;
  }

  static get easeInQuint() {
    return 'cubic-bezier(0.755, 0.050, 0.855, 0.060)';
  }

  static get easeOutQuint() {
    return 'cubic-bezier(0.230, 1.000, 0.320, 1.000)';
  }

  static get easeInOutQuint() {
    return 'cubic-bezier(0.860, 0.000, 0.070, 1.000)';
  }

  static get sine() {
    return `
      --ease-in-sine: ${CSSTimingFunction.easeInSine};
      --ease-out-sine: ${CSSTimingFunction.easeOutSine};
      --ease-in-out-sine: ${CSSTimingFunction.easeInOutSine};
    `;
  }

  static get easeInSine() {
    return 'cubic-bezier(0.470, 0.000, 0.745, 0.715)';
  }

  static get easeOutSine() {
    return 'cubic-bezier(0.390, 0.575, 0.565, 1.000)';
  }

  static get easeInOutSine() {
    return 'cubic-bezier(0.445, 0.050, 0.550, 0.950)';
  }

  static get expo() {
    return `
      --ease-in-expo: ${CSSTimingFunction.easeInExpo};
      --ease-out-expo: ${CSSTimingFunction.easeOutExpo};
      --ease-in-out-expo: ${CSSTimingFunction.easeInOutExpo};
    `;
  }

  static get easeInExpo() {
    return 'cubic-bezier(0.950, 0.050, 0.795, 0.035)';
  }

  static get easeOutExpo() {
    return 'cubic-bezier(0.190, 1.000, 0.220, 1.000)';
  }

  static get easeInOutExpo() {
    return 'cubic-bezier(1.000, 0.000, 0.000, 1.000)';
  }

  static get circ() {
    return `
      --ease-in-circ: ${CSSTimingFunction.easeInCirc};
      --ease-out-circ: ${CSSTimingFunction.easeOutCirc};
      --ease-in-out-circ: ${CSSTimingFunction.easeInOutCirc};
    `;
  }

  static get easeInCirc() {
    return 'cubic-bezier(0.600, 0.040, 0.980, 0.335)';
  }

  static get easeOutCirc() {
    return 'cubic-bezier(0.075, 0.820, 0.165, 1.000)';
  }

  static get easeInOutCirc() {
    return 'cubic-bezier(0.785, 0.135, 0.150, 0.860)';
  }

  static get back() {
    return `
      --ease-in-back: ${CSSTimingFunction.easeInBack};
      --ease-out-back: ${CSSTimingFunction.easeOutBack};
      --ease-in-out-back: ${CSSTimingFunction.easeInOutBack};
    `;
  }

  static get easeInBack() {
    return 'cubic-bezier(0.600, -0.280, 0.735, 0.045)';
  }

  static get easeOutBack() {
    return 'cubic-bezier(0.175, 0.885, 0.320, 1.275)';
  }

  static get easeInOutBack() {
    return 'cubic-bezier(0.680, -0.550, 0.265, 1.550)';
  }
}
