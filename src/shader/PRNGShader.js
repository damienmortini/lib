export default class PRNGShader {
  static random() {
    return `
      float random(float n){
        return fract(sin(n) * 43758.5453123);
      }

      float random(vec2 n){
        return fract(sin(dot(n.xy, vec2(12.9898,78.233))) * 43758.5453);
      }

      float random(vec3 n) {
        return random(vec2(random(n.xy), n.z));
      }

      float random(vec4 n) {
        return random(vec2(random(n.xyz), n.w));
      }
    `;
  }
}
