// From https://catlikecoding.com/unity/tutorials/flow/waves/

export default class GerstnerWaveShader {
  static get GerstnerWave() {
    return `
      struct GerstnerWave {
        vec2 direction;
        float wavenumber;
        float amplitude;
        float steepness;
        float speed;
      };
    `;
  }

  static gerstnerWave() {
    return `
      vec3 gerstnerWave(vec2 position, vec2 direction, float wavenumber, float amplitude, float steepness, float speed, float time) {
        float f = wavenumber * (dot(direction, position) - speed * time);

        float cosf = cos(f);
        float sinf = sin(f);
        
        return vec3(
          steepness * amplitude * direction.x * cosf,
          steepness * amplitude * sinf,
          steepness * amplitude * direction.y * cosf
        );
      }

      vec3 gerstnerWave(vec2 position, vec2 direction, float wavenumber, float amplitude, float steepness, float speed, float time, inout vec3 normal) {
        float f = wavenumber * (dot(direction, position) - speed * time);

        float cosf = cos(f);
        float sinf = sin(f);

        float WA = wavenumber * amplitude;
        normal.x += direction.x * WA * cosf;
        normal.y += steepness * WA * sinf;
        normal.z += direction.y * WA * cosf;
        
        return vec3(
          steepness * amplitude * direction.x * cosf,
          steepness * amplitude * sinf,
          steepness * amplitude * direction.y * cosf
        );
      }
    `;
  }
}
