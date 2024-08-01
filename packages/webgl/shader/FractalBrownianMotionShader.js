// https://www.shadertoy.com/view/4ttSWf
export const fbm = ({ noiseFunctionName }) => {
  return `float fbm(in vec3 x, int octaves, mat3 m3) {
  float f = 2.0;
  float s = 0.5;
  float a = 0.0;
  float b = 0.5;
  for(int i = 0; i < octaves; i++) {
    float n = ${noiseFunctionName}(x);
    a += b * n;
    b *= s;
    x = f * m3 * x;
  }
  return a;
}
`;
};

export const fbmd = ({ noiseFunctionName }) => {
  return `vec4 fbmd(in vec3 x, int octaves, mat3 m3, mat3 m3Inverted) {
  float f = 1.92;
  float s = 0.5;
  float a = 0.0;
  float b = 0.5;
  vec3 d = vec3(0.0);
  mat3 m = mat3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0);
  for(int i = 0; i < octaves; i++) {
    vec4 n = ${noiseFunctionName}(x);
    a += b * n.x;
    d += b * m * n.yzw;
    b *= s;
    x = f * m3 * x;
    m = f * m3Inverted * m;
  }
  return vec4(a, d);
}`;
};
