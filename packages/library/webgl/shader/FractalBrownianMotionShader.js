export default class FractalBrownianMotionShader {
  static fbmDerivatives3D({
    noiseFunctionName,
  }) {
    return `vec4 fbmDerivatives3D(in vec3 position, in uint octaves) {
  float f = 2.;
  float s = 0.5;
  float a = 0.0;
  float b = 0.5;
  vec3 d = vec3(0.0);
  mat3 m = mat3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0);
  for(int i = 0; i < octaves; i++) {
    vec4 n = ${noiseFunctionName}(position);
    a += b * n.x;
    d += b * m * n.yzw;
    b *= s;
    position = f * position;
    m = f * m;
  }
  return vec4(a, d);
}
`
  }
}
