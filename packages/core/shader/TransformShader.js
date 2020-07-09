export default class TransformShader {
  static rotate() {
    return `
      vec2 rotate(vec2 position, float angle, vec2 pivot) {
        float s = sin(angle);
        float c = cos(angle);
        mat2 m = mat2(c, -s, s, c);
        return m * (position - pivot) + pivot;
      }

      vec2 rotate(vec2 position, float angle) {
        float s = sin(angle);
        float c = cos(angle);
        mat2 m = mat2(c, -s, s, c);
        return m * position;
      }
    `;
  }

  static matrixFromRotation() {
    return `
      mat3 matrixFromRotation(vec3 eulerRotation) {
        float x = eulerRotation.x; 
        float y = eulerRotation.y;
        float z = eulerRotation.z;
        float a = cos(x);
        float b = sin(x);
        float c = cos(y);
        float d = sin(y);
        float e = cos(z);
        float f = sin(z);

        float ae = a * e;
        float af = a * f;
        float be = b * e;
        float bf = b * f;

        return mat3(c * e, af + be * d, bf - ae * d, - c * f, ae - bf * d, be + af * d, d, - b * c, a * c);
      }
    `;
  }
}
