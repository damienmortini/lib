export const threshold = () => {
  return `float threshold(float edge0, float edge1, float x) {
  return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}
`;
};

export const mirror = () => {
  return `vec2 mirror(vec2 v) {
  vec2 m = mod(v, 2.);
  return mix(m, 2. - m, step(1., m));
}
`;
};
