// From https://github.com/Jam3/glsl-fast-gaussian-blur

export const blur = ({ webGL1 = false } = {}) => {
  return `
    vec4 blur(sampler2D textureToBlur, vec2 uv, vec2 resolution, vec2 direction, float lod) {
      vec4 color = vec4(0.0);
      vec2 off1 = vec2(1.411764705882353) * direction;
      vec2 off2 = vec2(3.2941176470588234) * direction;
      vec2 off3 = vec2(5.176470588235294) * direction;
      color += ${webGL1 ? 'texture2DLodEXT' : 'textureLod'}(textureToBlur, uv, lod) * 0.1964825501511404;
      color += ${webGL1 ? 'texture2DLodEXT' : 'textureLod'}(textureToBlur, uv + (off1 / resolution), lod) * 0.2969069646728344;
      color += ${webGL1 ? 'texture2DLodEXT' : 'textureLod'}(textureToBlur, uv - (off1 / resolution), lod) * 0.2969069646728344;
      color += ${webGL1 ? 'texture2DLodEXT' : 'textureLod'}(textureToBlur, uv + (off2 / resolution), lod) * 0.09447039785044732;
      color += ${webGL1 ? 'texture2DLodEXT' : 'textureLod'}(textureToBlur, uv - (off2 / resolution), lod) * 0.09447039785044732;
      color += ${webGL1 ? 'texture2DLodEXT' : 'textureLod'}(textureToBlur, uv + (off3 / resolution), lod) * 0.010381362401148057;
      color += ${webGL1 ? 'texture2DLodEXT' : 'textureLod'}(textureToBlur, uv - (off3 / resolution), lod) * 0.010381362401148057;
      return color;
    }
  `;
};
