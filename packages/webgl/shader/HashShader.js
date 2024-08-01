// https://www.shadertoy.com/view/XlGcRh
// https://www.shadertoy.com/view/XdXBRH
// https://www.shadertoy.com/view/fljGWz

export const hash1 = ({ noUInt = false } = {}) => {
  return `float hash1(float p) {
  p = fract(p * .1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash1(vec2 p) {
  vec3 p3  = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash1(vec3 p3) {
  p3  = fract(p3 * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash1(vec4 n) {
  return hash1(vec2(hash1(n.xyz), n.w));
}
    ` + (noUInt
    ? ''
    : `
float hash1(uint v) {
  uint state = v * 747796405u + 2891336453u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  uint hash = (word >> 22u) ^ word;
  return float(hash) * (1.0 / float(0xffffffffu));
}

// TODO change these to use PCG (https://www.shadertoy.com/view/XlGcRh)
float hash1(uvec2 x) {
  uvec2 q = 1103515245U * ((x >> 1U) ^ (x.yx));
  uint n = 1103515245U * ((q.x) ^ (q.y >> 3U));
  return float(n) * (1.0 / float(0xffffffffU));
}

float hash1(uvec3 i) {
  i*=uvec3(0x456789ab,0x1b74a659,0x46d5c422);
	i.x^=i.y^i.z;
  return float(i.x*0x666aa045u)/4294967295.;
}
`);
};

export const uhash1 = () => {
  return `uint uhash1(uint v) {
  uint state = v * 747796405u + 2891336453u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}
`;
};

export const hash2 = ({ noUInt = false } = {}) => {
  return `vec2 hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
  p3 += dot(p3, p3.yzx+33.33);
  return fract((p3.xx+p3.yz)*p3.zy);
}
    ` + (noUInt
    ? ''
    : `
vec2 hash2(uint n) {
  // integer hash copied from Hugo Elias
  n = (n << 13U) ^ n;
  n = n * (n * n * 15731U + 789221U) + 1376312589U;
  uvec3 k = n * uvec3(n, n * 16807U, n * 48271U);
  return (vec3(k & uvec3(0x7fffffffU)) / float(0x7fffffff)).xy;
}

vec2 hash2(uvec2 x) {
  x = ((x >> 8U) ^ x.yx) * 1103515245U;
  x = ((x >> 8U) ^ x.yx) * 1103515245U;
  x = ((x >> 8U) ^ x.yx) * 1103515245U;

  return vec2(x) * (1.0 / float(0xffffffffU));
}
`);
};

export const hash3 = () => {
  return `vec3 hash3(vec3 p3) {
  p3 = fract(p3 * vec3(.1031, .1030, .0973));
  p3 += dot(p3, p3.yxz+33.33);
  return fract((p3.xxy + p3.yxx)*p3.zyx);
}

vec3 hash3(uint n) {
  // integer hash copied from Hugo Elias
  n = (n << 13U) ^ n;
  n = n * (n * n * 15731U + 789221U) + 1376312589U;
  uvec3 k = n * uvec3(n, n * 16807U, n * 48271U);
  return vec3(k & uvec3(0x7fffffffU)) / float(0x7fffffff);
}

vec3 hash3(uvec3 x) {
  x = ((x >> 8U) ^ x.yzx) * 1103515245U;
  x = ((x >> 8U) ^ x.yzx) * 1103515245U;
  x = ((x >> 8U) ^ x.yzx) * 1103515245U;

  return vec3(x) * (1.0 / float(0xffffffffU));
}
`;
};
