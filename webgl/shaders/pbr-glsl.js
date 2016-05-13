// from https://www.shadertoy.com/view/XsfXWX

export default function({
  map = `
  vec3 metalRayPick(vec3 p) {
    return vec3(0.);
  }
  `
} = {}) {
  return `
struct Light
{
  vec3 color;
  vec3 direction;
};

float G1V ( float dotNV, float k ) {
	return 1.0 / (dotNV*(1.0 - k) + k);
}

float GGX(vec3 N, vec3 V, vec3 L, float roughness, float F0) {
  float alpha = roughness*roughness;
	vec3 H = normalize (V + L);

	float dotNL = clamp (dot (N, L), 0.0, 1.0);
	float dotNV = clamp (dot (N, V), 0.0, 1.0);
	float dotNH = clamp (dot (N, H), 0.0, 1.0);
	float dotLH = clamp (dot (L, H), 0.0, 1.0);

	float D, vis;
	float F;

	// NDF : GGX
	float alphaSqr = alpha*alpha;
	float pi = 3.1415926535;
	float denom = dotNH * dotNH *(alphaSqr - 1.0) + 1.0;
	D = alphaSqr / (pi * denom * denom);

	// Fresnel (Schlick)
	float dotLH5 = pow (1.0 - dotLH, 5.0);
	F = F0 + (1.0 - F0)*(dotLH5);

	// Visibility term (G) : Smith with Schlick's approximation
	float k = alpha / 2.0;
	vis = G1V (dotNL, k) * G1V (dotNV, k);

	return /*dotNL */ D * F * vis;
}

vec3 computePBRLighting (
  Light light,
  Ray ray,
  vec3 position,
  vec3 normal,
  vec3 albedo,
  float metalness,
  float roughness,
  samplerCube reflectionTexture
) {

  // material
  float fresnel_pow = 1.5;
  vec3 color_mod = vec3(1.0);
  light.color *= textureCube(reflectionTexture, vec3(1.0,0.0,0.0)).xyz * 1.2;

  // IBL
  vec3 ibl_diffuse = textureCube(reflectionTexture, normalize(normal + vec3(rand(position.x * 2. - 1.), rand(position.y * 2. - 1.), rand(position.z * 2. - 1.)) * .5)).xyz;
  float blurRatio = (ibl_diffuse.r + ibl_diffuse.g + ibl_diffuse.b) / 3.;
  ibl_diffuse = ibl_diffuse * blurRatio + (1. - blurRatio);
  vec3 ibl_reflection = textureCube(reflectionTexture, normalize(reflect(ray.direction, normal) + vec3(rand(position.x * 2. - 1.), rand(position.y * 2. - 1.), rand(position.z * 2. - 1.)) * .5)).xyz;
  blurRatio = (ibl_reflection.r + ibl_reflection.g + ibl_reflection.b) / 3.;
  ibl_reflection = ibl_reflection * blurRatio + (1. - blurRatio);

  // fresnel
  float fresnel = max(1.0 - dot(normal, -ray.direction), 0.0);
  fresnel = pow(fresnel, fresnel_pow);

  // reflection
  vec3 refl = textureCube(reflectionTexture, reflect(ray.direction,normal)).xyz;
  refl = mix(refl, ibl_reflection, (1.0-fresnel)*roughness);
  refl = mix(refl, ibl_reflection, roughness);

  // specular
  float power = 1.0 / max(roughness * 0.4,0.01);
  vec3 spec = light.color * GGX(normal, -ray.direction, -light.direction, roughness * 0.7, 0.2);
  refl -= spec;

  // diffuse
  vec3 diff = ibl_diffuse * albedo;
  diff = mix(diff * color_mod, refl, fresnel);

  vec3 color = mix(diff, refl * color_mod, metalness) + spec;
  return color;
}
`};
