precision highp float;

vec4 bumpFromDepth(sampler2D texture, vec2 uv, float scale) {
  vec2 size = vec2(.002, .0) * scale;
  vec3 off = vec3(-.001, 0., .001) * scale;

  float s11 = texture2D(texture, uv).x;
  float s01 = texture2D(texture, uv + off.xy).x;
  float s21 = texture2D(texture, uv + off.zy).x;
  float s10 = texture2D(texture, uv + off.yx).x;
  float s12 = texture2D(texture, uv + off.yz).x;
  vec3 va = normalize(vec3(size.xy, s21 - s01));
  vec3 vb = normalize(vec3(size.yx, s12 - s10));
  vec4 bump = vec4(cross(va,vb), s11);
  bump = bump * .5 + .5;;
  return bump;
}
