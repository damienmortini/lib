export default class LightShader {
  static Light() {
    return `
      struct Light
      {
        vec3 color;
        vec3 direction;
      };
    `
  }
}
