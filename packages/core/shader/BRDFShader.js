export default class BRDFShader {
  static ggx() {
    return `
      float ggx(float NoH, float roughness) {
        roughness = roughness * roughness;
        float a = NoH * roughness;
        float k = roughness / (1.0 - NoH * NoH + a * a);
        return k * k * (1.0 / 3.141592653589793);
      }

      float ggx(vec3 viewDirection, vec3 lightDirection, vec3 normal, float roughness) {
        vec3 h = normalize(-viewDirection - lightDirection);
        float NoH = clamp(dot(normal, h), 0.0, 1.0);
        return ggx(NoH, roughness);
      }
    `;
  }
}