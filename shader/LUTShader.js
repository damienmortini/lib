export default class LUTShader {
  // Adapted from Matt DesLauriers - https://github.com/mattdesl/glsl-lut
  // FOR LUT of 64x64x64
  static computeLUT64() {
    return `
      vec3 computeLUT64(vec3 color, sampler2D lutTexture)
      {
        float blueColor = color.b * 63.0;

        vec2 quad1;
        quad1.y = floor(floor(blueColor) / 8.0);
        quad1.x = floor(blueColor) - (quad1.y * 8.0);

        vec2 quad2;
        quad2.y = floor(ceil(blueColor) / 8.0);
        quad2.x = ceil(blueColor) - (quad2.y * 8.0);

        vec2 texPos1;
        texPos1.x = (quad1.x * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * color.r);
        texPos1.y = (quad1.y * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * color.g);

        vec2 texPos2;
        texPos2.x = (quad2.x * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * color.r);
        texPos2.y = (quad2.y * 0.125) + 0.5 / 512.0 + ((0.125 - 1.0 / 512.0) * color.g);

        vec3 newColor1 = texture2D(lutTexture, texPos1).rgb;
        vec3 newColor2 = texture2D(lutTexture, texPos2).rgb;

        vec3 newColor = mix(newColor1, newColor2, fract(blueColor));
        return newColor;
      }
    `;
  }
}
