export default class LightShader {
  static get Light() {
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
