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

  static quaternionFromMatrix() {
    return `
      vec4 quaternionFromMatrix(mat4 a) {
        float fTrace = m[0] + m[4] + m[8];
        float fRoot;
        if (fTrace > 0.0) {
          fRoot = sqrt(fTrace + 1.0);
          out[3] = 0.5 * fRoot;
          fRoot = 0.5 / fRoot;
          out[0] = (m[5] - m[7]) * fRoot;
          out[1] = (m[6] - m[2]) * fRoot;
          out[2] = (m[1] - m[3]) * fRoot;
        } else {
          uint i = 0;
          if (m[4] > m[0]) i = 1;
          if (m[8] > m[i * 3 + i]) i = 2;
          float j = (i + 1) % 3;
          float k = (i + 2) % 3;
          fRoot = sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
          out[i] = 0.5 * fRoot;
          fRoot = 0.5 / fRoot;
          out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
          out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
          out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
        }
        return out;
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
