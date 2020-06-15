// https://google.github.io/filament/Filament.md.html#materialsystem/diffusebrdf

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


  // TODO: fix
  static ggxSmith() {
    return `
      float ggxSmith(float NoV, float NoL, float roughness) {
        float a2 = roughness * roughness;
        float GGXV = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
        float GGXL = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
        return 0.5 / (GGXV + GGXL);
      }

      float ggxSmith(vec3 viewDirection, vec3 lightDirection, vec3 normal, float roughness) {
        float NoV = abs(dot(normal, -viewDirection)) + 1e-5;
        float NoL = clamp(dot(normal, -lightDirection), 0.0, 1.0);
        return ggxSmith(NoV, NoL, roughness);
      }
    `;
  }
}