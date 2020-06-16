// https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/master/src/shaders/brdf.glsl
// https://google.github.io/filament/Filament.md.html#materialsystem/diffusebrdf
// https://github.com/google/filament/blob/master/shaders/src/brdf.fs

export default class BRDFShader {
  static brdfDistributionGGX() {
    return `
      #define M_PI 3.141592653589793

      float brdfDistributionGGX(float NdotH, float roughness) {
        float alphaRoughnessSq = roughness * roughness * roughness * roughness;
        float f = (NdotH * NdotH) * (alphaRoughnessSq - 1.0) + 1.0;
        return alphaRoughnessSq / (M_PI * f * f);
      }

      float brdfDistributionGGX(vec3 viewDirection, vec3 lightDirection, vec3 normal, float roughness) {
        vec3 h = normalize(-lightDirection - viewDirection);
        float NdotH = clamp(dot(normal, h), 0.0, 1.0);
        return brdfDistributionGGX(NdotH, roughness);
      }
    `;
  }

  static brdfVisibilityGGX() {
    return `
      float brdfVisibilityGGX(float NdotV, float NdotL, float roughness) {
        float alphaRoughnessSq = roughness * roughness * roughness * roughness;

        float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);
        float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);

        float GGX = GGXV + GGXL;
        if (GGX > 0.0)
        {
            return 0.5 / GGX;
        }
        return 0.0;
      }

      float brdfVisibilityGGX(vec3 viewDirection, vec3 lightDirection, vec3 normal, float roughness) {
        float NdotV = 1. - clamp(dot(normal, viewDirection), 0.0, 1.0);
        float NdotL = 1. - clamp(dot(normal, -lightDirection), 0.0, 1.0);
        return brdfVisibilityGGX(NdotV, NdotL, roughness);
      }
    `;
  }

  // TODO finalize
  static brdfFresnel() {
    return `
      vec3 brdfFresnel(const vec3 f0, float f90, float VdotH) {
        return f0 + (f90 - f0) * pow(1.0 - VdotH, 5.0);
      }
  
      vec3 brdfFresnel(const vec3 f0, float VdotH) {
          float f = pow(1.0 - VdotH, 5.0);
          return f + f0 * (1.0 - f);
      }
  
      float brdfFresnel(float f0, float f90, float VdotH) {
          return f0 + (f90 - f0) * pow(1.0 - VdotH, 5.0);
      }

      float brdfFresnel(vec3 viewDirection, vec3 lightDirection, float f0) {
        vec3 h = normalize(-lightDirection - viewDirection);
        float VdotH = clamp(dot(-viewDirection, h), 0.0, 1.0);
        return brdfFresnel(f0, VdotH);
      }

      vec3 brdfFresnel(vec3 viewDirection, vec3 lightDirection, vec3 f0) {
        vec3 h = normalize(-lightDirection - viewDirection);
        float VdotH = clamp(dot(-viewDirection, h), 0.0, 1.0);
        return brdfFresnel(f0, VdotH);
      }
    `;
  }

  // TODO finalize
  static brdfDiffuse() {
    return `
      ${BRDFShader.brdfFresnel()}

      float brdfDiffuse(float roughness, float NoV, float NoL, float LoH) {
        // Burley 2012, "Physically-Based Shading at Disney"
        float f90 = 0.5 + 2.0 * roughness * LoH * LoH;
        float lightScatter = brdfFresnel(1.0, f90, NoL);
        float viewScatter  = brdfFresnel(1.0, f90, NoV);
        return lightScatter * viewScatter * (1.0 / PI);
      }

      float brdfDiffuse(float roughness, float NdotV, float NdotL, float LdotH) {

      }
    `;
  }

  // TODO finalize
  static brdfSpecular() {
    return `
      ${BRDFShader.brdfDistributionGGX()}
      ${BRDFShader.brdfVisibilityGGX()}
  
      vec3 brdfSpecular(vec3 viewDirection, vec3 lightDirection, vec3 normal, float roughness, float metalness) {
        float D = brdfDistributionGGX(viewDirection, lightDirection, normal, roughness);
        float V = brdfVisibilityGGX(viewDirection, lightDirection, normal, roughness);
        float F = brdfFresnel(viewDirection, lightDirection, metalness);
        return (D * V) * F;
      }
    `;
  }
}