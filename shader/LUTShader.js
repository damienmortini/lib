export default class LUTShader {
  // Adapted from Matt DesLauriers - https://github.com/mattdesl/glsl-lut
  // FOR LUT of 64x64x64
  static computeLUT64() {
    return `
      vec3 computeLUT64(vec3 color, sampler2D lutTexture, vec4 lutRectangle)
      {
        float blueColor = color.b * 63.0;

        vec2 quad1;
        quad1.y = floor(floor(blueColor) / 8.0);
        quad1.x = floor(blueColor) - (quad1.y * 8.0);

        quad1.x += lutRectangle.x;
        quad1.y += lutRectangle.y;

        vec2 quad2;
        quad2.y = floor(ceil(blueColor) / 8.0);
        quad2.x = ceil(blueColor) - (quad2.y * 8.0);

        quad2.x += lutRectangle.x;
        quad2.y += lutRectangle.y;

        float width = 0.125 * lutRectangle.z;
        float height = 0.125 * lutRectangle.w;

        vec2 texPos1;
        texPos1.x = (quad1.x * width) + 0.5 / 512.0 + ((width - 1.0 / 512.0) * color.r);
        texPos1.y = (quad1.y * height) + 0.5 / 512.0 + ((height - 1.0 / 512.0) * color.g);

        vec2 texPos2;
        texPos2.x = (quad2.x * width) + 0.5 / 512.0 + ((width - 1.0 / 512.0) * color.r);
        texPos2.y = (quad2.y * height) + 0.5 / 512.0 + ((height - 1.0 / 512.0) * color.g);

        vec3 newColor1 = texture2D(lutTexture, texPos1).rgb;
        vec3 newColor2 = texture2D(lutTexture, texPos2).rgb;

        vec3 newColor = mix(newColor1, newColor2, fract(blueColor));
        return newColor;
      }

      vec3 computeLUT64(vec3 color, sampler2D lutTexture) {
        return computeLUT64(color, lutTexture, vec4(0., 0., 1., 1.));
      }
    `;
  }
}
