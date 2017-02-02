const bumpFromDepth = (packed) => {
  return `
    vec4 bumpFrom${packed ? "Packed" : ""}Depth(sampler2D texture, vec2 uv, vec2 resolution) {
      vec3 size = vec3(.5, .5, 0.);
      size.xy /= resolution;

      float s11 = ${packed ? "unpack(" : ""}texture2D(texture, uv)${packed ? ")" : ".r"};
      float s01 = ${packed ? "unpack(" : ""}texture2D(texture, uv - size.xz)${packed ? ")" : ".r"};
      float s21 = ${packed ? "unpack(" : ""}texture2D(texture, uv + size.xz)${packed ? ")" : ".r"};
      float s10 = ${packed ? "unpack(" : ""}texture2D(texture, uv - size.zy)${packed ? ")" : ".r"};
      float s12 = ${packed ? "unpack(" : ""}texture2D(texture, uv + size.zy)${packed ? ")" : ".r"};
      vec3 va = normalize(vec3(size.xz, s21 - s01));
      vec3 vb = normalize(vec3(size.zy, s12 - s10));
      vec4 bump = vec4(cross(va,vb), s11);
      return bump;
    }
  `;
}

export default class DepthShader {
  static packing() {
    return `
      vec4 pack (float depth) {
        const vec4 bitSh = vec4(256 * 256 * 256, 256 * 256, 256, 1.0);
        const vec4 bitMsk = vec4(0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
        vec4 comp = fract(depth * bitSh);
        comp -= comp.xxyz * bitMsk;
        return comp;
      }

      float unpack (vec4 packedDepth) {
        const vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1);
        return dot(packedDepth, bitShifts);
      }
    `;
  }

  static bumpFromDepth() {
    return bumpFromDepth(false);
  }

  static bumpFromPackedDepth() {
    return bumpFromDepth(true);
  }
}
