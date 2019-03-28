// GGX from from http://www.filmicworlds.com/images/ggx-opt/optimized-ggx.hlsl
// PBR adapted from from https://www.shadertoy.com/view/XsfXWX

import LightShader from "./LightShader.js";
import RayShader from "./RayShader.js";
import CameraShader from "./CameraShader.js";
import Shader from "../3d/Shader.js";

export default class PBRShader extends Shader {
  static get PhysicallyBasedMaterial() {
    return `
    struct PhysicallyBasedMaterial
    {
      vec4 baseColor;
      float metallic;
      float roughness;
      float reflectance;
    };
    `;
  }

  static ggx() {
    return `
    #define PI 3.1415926535897932384626433832795

    float G1V(float dotNV, float k)
    {
      return 1. / (dotNV * (1. - k) + k);
    }

    float ggx(vec3 N, vec3 V, vec3 L, float roughness, float F0)
    {
      roughness = .01 + roughness * .99;

      float alpha = roughness * roughness;

      vec3 H = normalize(V + L);

      float dotNL = clamp(dot(N, L), 0., 1.);
      float dotNV = clamp(dot(N, V), 0., 1.);
      float dotNH = clamp(dot(N, H), 0., 1.);
      float dotLH = clamp(dot(L, H), 0., 1.);

      float F, D, vis;

      // D
      float alphaSqr = alpha * alpha;
      float denom = dotNH * dotNH * (alphaSqr - 1.) + 1.;
      D = alphaSqr / (PI * denom * denom);

      // F
      float dotLH5 = pow(1. - dotLH, 5.);
      F = F0 + (1. - F0) * dotLH5;

      // V
      float k = alpha / 2.;
      vis = G1V(dotNL, k) * G1V(dotNV, k);

      float specular = dotNL * D * F * vis;
      return specular;
    }
    `;
  }

  static computeGGXLighting() {
    return `
    vec3 computeGGXLighting (
      Ray ray,
      Light light,
      vec3 normal,
      PhysicallyBasedMaterial material
    ) {
      vec3 specular = light.color * ggx(normal, -ray.direction, -light.direction, material.roughness, material.reflectance);
      return specular;
    }
    `;
  }

  static computeSimplePBRColor({
    pbrReflectionFromRay = `
      ray.direction *= 1. / max(roughness, .0001);
      ray.direction = clamp(ray.direction, vec3(-1.), vec3(1.));
      vec4 color = vec4(vec3(ray.direction * .5 + .5), 1.);
      float grey = (color.r + color.g + color.b) / 3.;
      return vec4(vec3(grey), 1.);
    `,
  } = {}) {
    return `
    vec4 pbrReflectionFromRay(
      Ray ray,
      float roughness
    ) {
      ${pbrReflectionFromRay}
    }

    vec4 computeSimplePBRColor (
      Ray ray,
      Light light,
      vec3 position,
      vec3 normal,
      PhysicallyBasedMaterial material
    ) {
      light.color *= light.intensity;

      // fresnel
      float fresnel = 1. - dot(mix(normal, -ray.direction, material.roughness), -ray.direction);

      // reflection
      vec4 reflection = pbrReflectionFromRay(Ray(position, normalize(reflect(ray.direction, normal))), material.roughness);

      // diffuse
      vec4 color = mix(material.baseColor, material.baseColor * reflection, material.metallic);
      color = mix(color, reflection, fresnel);
      color.rgb *= light.color;

      color.rgb += computeGGXLighting(ray, light, normal, material);
      color.rgb = clamp(vec3(0.), vec3(1.), color.rgb);

      return color;
    }
    `;
  }

  static computePBRColor({
    pbrReflectionFromRay = `
      ray.direction *= 1. / roughness;
      ray.direction = clamp(ray.direction, vec3(-1.), vec3(1.));
      vec3 color = ray.direction * .5 + .5;
      float grey = (color.r + color.g + color.b) / 3.;
      return vec3(grey);
    `,
    pbrDiffuseLightFromRay = `
      vec3 color = ray.direction * .5 + .5;
      float grey = (color.r + color.g + color.b) / 3.;
      return vec3(grey);
    `,
  } = {}) {
    return `
    vec3 pbrReflectionFromRay(
      Ray ray,
      float roughness
    ) {
      ${pbrReflectionFromRay}
    }

    vec3 pbrDiffuseLightFromRay(
      Ray ray
    ) {
      ${pbrDiffuseLightFromRay}
    }

    // From https://github.com/KhronosGroup/glTF-WebGL-PBR

    // This fragment shader defines a reference implementation for Physically Based Shading of
    // a microfacet surface material defined by a glTF model.
    //
    // References:
    // [1] Real Shading in Unreal Engine 4
    //     http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
    // [2] Physically Based Shading at Disney
    //     http://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf
    // [3] README.md - Environment Maps
    //     https://github.com/KhronosGroup/glTF-WebGL-PBR/#environment-maps
    // [4] "An Inexpensive BRDF Model for Physically based Rendering" by Christophe Schlick
    //     https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf

    // Encapsulate the various inputs used by the various functions in the shading equation
    // We store values in this struct to simplify the integration of alternative implementations
    // of the shading terms, outlined in the Readme.MD Appendix.
    struct PBRInfo
    {
        float NdotL;                  // cos angle between normal and light direction
        float NdotV;                  // cos angle between normal and view direction
        float NdotH;                  // cos angle between normal and half vector
        float LdotH;                  // cos angle between light direction and half vector
        float VdotH;                  // cos angle between view direction and half vector
        float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
        float metalness;              // metallic value at the surface
        vec3 reflectance0;            // full reflectance color (normal incidence angle)
        vec3 reflectance90;           // reflectance color at grazing angle
        float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
        vec3 diffuseColor;            // color contribution from diffuse lighting
        vec3 specularColor;           // color contribution from specular lighting
    };

    const float M_PI = 3.141592653589793;
    const float c_MinRoughness = 0.04;

    // Calculation of the lighting contribution from an optional Image Based Light source.
    // Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
    // See our README.md on Environment Maps [3] for additional discussion.
    vec3 getIBLContribution(PBRInfo pbrInputs, vec3 n, vec3 reflection, vec3 position)
    {
      vec3 diffuseLight = pbrDiffuseLightFromRay(Ray(position, n));

      // Fake BRDF Lookup
      vec2 brdfPosition = vec2(pbrInputs.NdotV, pbrInputs.perceptualRoughness);
      float brdfLength = length(brdfPosition);
      vec2 brdf = vec2(1. - smoothstep(0., 2., brdfLength), 1. - smoothstep(0., .3, brdfLength));
      brdf.x *= 1. - brdf.y;
    
      vec3 specularLight = pbrReflectionFromRay(Ray(position, reflection), pbrInputs.alphaRoughness);
    
      vec3 diffuse = diffuseLight * pbrInputs.diffuseColor;
      vec3 specular = specularLight * (pbrInputs.specularColor * brdf.x + brdf.y);

      return diffuse + specular;
    }

    // Basic Lambertian diffuse
    // Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
    // See also [1], Equation 1
    vec3 diffuse(PBRInfo pbrInputs)
    {
        return pbrInputs.diffuseColor / M_PI;
    }

    // The following equation models the Fresnel reflectance term of the spec equation (aka F())
    // Implementation of fresnel from [4], Equation 15
    vec3 specularReflection(PBRInfo pbrInputs)
    {
        return pbrInputs.reflectance0 + (pbrInputs.reflectance90 - pbrInputs.reflectance0) * pow(clamp(1.0 - pbrInputs.VdotH, 0.0, 1.0), 5.0);
    }

    // This calculates the specular geometric attenuation (aka G()),
    // where rougher material will reflect less light back to the viewer.
    // This implementation is based on [1] Equation 4, and we adopt their modifications to
    // alphaRoughness as input as originally proposed in [2].
    float geometricOcclusion(PBRInfo pbrInputs)
    {
        float NdotL = pbrInputs.NdotL;
        float NdotV = pbrInputs.NdotV;
        float r = pbrInputs.alphaRoughness;

        float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
        float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
        return attenuationL * attenuationV;
    }

    // The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
    // Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
    // Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
    float microfacetDistribution(PBRInfo pbrInputs)
    {
        float roughnessSq = pbrInputs.alphaRoughness * pbrInputs.alphaRoughness;
        float f = (pbrInputs.NdotH * roughnessSq - pbrInputs.NdotH) * pbrInputs.NdotH + 1.0;
        return roughnessSq / (M_PI * f * f);
    }

    vec4 computePBRColor(
      vec3 viewDirection,
      Light light,
      vec3 position,
      vec3 normal,
      PhysicallyBasedMaterial material
    )
    {
        // Metallic and Roughness material properties are packed together
        // In glTF, these factors can be specified by fixed scalar values
        // or from a metallic-roughness map
        float perceptualRoughness = material.roughness;
        float metallic = material.metallic;

        perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
        metallic = clamp(metallic, 0.0, 1.0);
        // Roughness is authored as perceptual roughness; as is convention,
        // convert to material roughness by squaring the perceptual roughness [2].
        float alphaRoughness = perceptualRoughness * perceptualRoughness;

        vec4 baseColor = material.baseColor;

        vec3 f0 = vec3(0.04);
        vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
        diffuseColor *= 1.0 - metallic;
        vec3 specularColor = mix(f0, baseColor.rgb, metallic);

        // Compute reflectance.
        float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

        // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
        // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
        float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
        vec3 specularEnvironmentR0 = specularColor.rgb;
        vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

        vec3 n = normal;                                  // normal at surface point
        vec3 v = -viewDirection;                          // Vector from surface point to camera
        vec3 l = normalize(-light.direction);             // Vector from surface point to light
        vec3 h = normalize(l+v);                          // Half vector between both l and v
        vec3 reflection = -normalize(reflect(v, n));

        float NdotL = clamp(dot(n, l), 0.001, 1.0);
        float NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
        float NdotH = clamp(dot(n, h), 0.0, 1.0);
        float LdotH = clamp(dot(l, h), 0.0, 1.0);
        float VdotH = clamp(dot(v, h), 0.0, 1.0);

        PBRInfo pbrInputs = PBRInfo(
            NdotL,
            NdotV,
            NdotH,
            LdotH,
            VdotH,
            perceptualRoughness,
            metallic,
            specularEnvironmentR0,
            specularEnvironmentR90,
            alphaRoughness,
            diffuseColor,
            specularColor
        );

        // Calculate the shading terms for the microfacet specular shading model
        vec3 F = specularReflection(pbrInputs);
        float G = geometricOcclusion(pbrInputs);
        float D = microfacetDistribution(pbrInputs);

        // Calculation of analytical lighting contribution
        vec3 diffuseContrib = (1.0 - F) * diffuse(pbrInputs);
        vec3 specContrib = F * G * D / (4.0 * NdotL * NdotV);
        // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
        vec3 color = NdotL * light.color * (diffuseContrib + specContrib);

        // Calculate lighting contribution from image based lighting source (IBL)
        color += getIBLContribution(pbrInputs, n, reflection, position);

        return vec4(pow(color,vec3(1.0/2.2)), baseColor.a);
      }
    `;
  }

  constructor({
    baseColor = [1, 1, 1, 1],
    metallic = 0,
    roughness = 0,
    reflectance = 1,
    uniforms = {},
    vertexShaderChunks = [],
    fragmentShaderChunks = [],
    uvs = true,
    pbrDiffuseLightFromRay = undefined,
    pbrReflectionFromRay = undefined,
  } = {}) {
    super({
      uniforms: Object.assign({
        material: {
          baseColor,
          metallic,
          roughness,
          reflectance,
        },
      }, uniforms),
      vertexShaderChunks: [
        ["start", `
            ${CameraShader.Camera}
            ${RayShader.Ray}
            
            uniform Camera camera;
            uniform mat4 projectionView;
            uniform mat4 transform;
    
            in vec3 position;
            in vec3 normal;
            ${uvs ? "in vec2 uv;" : ""}
            
            out vec3 vPosition;
            out vec3 vNormal;
            ${uvs ? "out vec2 vUV;" : ""}
            out vec3 vViewDirection;
    
            ${RayShader.rayFromCamera()}
         `],
        ["end", `
          ${uvs ? "vUV = uv;" : ""}
          gl_Position = camera.projectionView * transform * vec4(position, 1.);
          vPosition = position;
          vNormal = normalize(mat3(transform) * normal);
          Ray ray = rayFromCamera(gl_Position.xy / gl_Position.w, camera);
          vViewDirection = ray.direction;
        `],
        ...vertexShaderChunks,
      ],
      fragmentShaderChunks: [
        ["start", `
          ${LightShader.Light}
          ${RayShader.Ray}
          ${PBRShader.PhysicallyBasedMaterial}
  
          uniform PhysicallyBasedMaterial material;
          uniform Light light;
  
          in vec3 vPosition;
          in vec3 vNormal;
          ${uvs ? "in vec2 vUV;" : ""}
          in vec3 vViewDirection;
  
          ${PBRShader.ggx()}
          ${PBRShader.computeGGXLighting()}
          ${PBRShader.computePBRColor({ pbrDiffuseLightFromRay, pbrReflectionFromRay })}
        `],
        ["end", `
          Light light = Light(vec3(1.), vec3(1.), normalize(vec3(-1.)), 1.);
          fragColor = computePBRColor(vViewDirection, light, vPosition, vNormal, material);
          // fragColor = vec4(vViewDirection, 1.);
        `],
        ...fragmentShaderChunks,
      ],
    });
  }
}
