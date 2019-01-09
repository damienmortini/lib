export default class LightShader {
  static Light() {
    return `
      struct Light
      {
        vec3 color;
        vec3 position;
        vec3 direction;
        float intensity;
      };
    `
  }
}
