export default class MathShader {
  static threshold() {
    return `
      float threshold(float edge0, float edge1, float x) {
        return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
      }
    `;
  }
}
