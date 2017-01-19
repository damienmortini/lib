export default class DepthGLSL {
  static packing() {
    return `
      vec4 pack (float depth)
      {
        const vec4 bitSh = vec4(256 * 256 * 256,
          256 * 256,
          256,
          1.0);
          const vec4 bitMsk = vec4(0,
            1.0 / 256.0,
            1.0 / 256.0,
            1.0 / 256.0);
            vec4 comp = fract(depth * bitSh);
            comp -= comp.xxyz * bitMsk;
            return comp;
        }

        float unpack (vec4 colour)
        {
          const vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0),
          1.0 / (256.0 * 256.0),
          1.0 / 256.0,
          1);
          return dot(colour , bitShifts);
        }
    `;
  }

  static bumpFromDepth() {
    return `
      vec4 bumpFromDepth(sampler2D texture, vec2 uv, vec2 resolution) {
        vec2 size = vec2(.5, .0);
        vec2 offset = vec2(.5, 0.);

        float s11 = texture2D(texture, uv).r;
        float s01 = texture2D(texture, uv + -offset.xy / resolution).r;
        float s21 = texture2D(texture, uv + offset.xy / resolution).r;
        float s10 = texture2D(texture, uv - offset.yx / resolution).r;
        float s12 = texture2D(texture, uv + offset.yx / resolution).r;
        vec3 va = normalize(vec3(size.xy / resolution, s21 - s01));
        vec3 vb = normalize(vec3(size.yx / resolution, s12 - s10));
        vec4 bump = vec4(cross(va,vb), s11);
        return bump;
      }
    `;
  }

  static bumpFromPackedDepth() {
    return `
      vec4 bumpFromDepth(sampler2D texture, vec2 uv, float scale) {
        vec2 size = vec2(.002, .0) * scale;
        vec3 off = vec3(-.001, 0., .001) * scale;

        float s11 = unpack(texture2D(texture, uv));
        float s01 = unpack(texture2D(texture, uv + off.xy));
        float s21 = unpack(texture2D(texture, uv + off.zy));
        float s10 = unpack(texture2D(texture, uv + off.yx));
        float s12 = unpack(texture2D(texture, uv + off.yz));
        vec3 va = normalize(vec3(size.xy, s21 - s01));
        vec3 vb = normalize(vec3(size.yx, s12 - s10));
        vec4 bump = vec4(cross(va,vb), s11);
        return bump;
      }
    `;
  }
}
