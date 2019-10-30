// From https://catlikecoding.com/unity/tutorials/flow/waves/

export default class GerstnerWaveShader {
  static get GerstnerWave() {
    return `
      struct GerstnerWave {
        vec2 direction;
        float wavelength;
        float steepness;
        float speed;
      };
    `;
  }

  static gerstnerWave() {
    return `
      vec3 gerstnerWave(vec2 position, float time, vec2 direction, float wavelength, float steepness, float speed) {
        float wavenumber = 2. * ${Math.PI} / wavelength;
        float amplitude = steepness / wavenumber;

        float f = wavenumber * (dot(direction, position) - speed * time);

        float cosf = cos(f);
        float sinf = sin(f);
        
        return vec3(
          amplitude * direction.x * cosf,
          amplitude * sinf,
          amplitude * direction.y * cosf
        );
      }

      vec3 gerstnerWave(vec2 position, float time, vec2 direction, float wavelength, float steepness, float speed, inout vec3 normal) {
        float wavenumber = 2. * ${Math.PI} / wavelength;
        float amplitude = steepness / wavenumber;

        float f = wavenumber * (dot(direction, position) - speed * time);

        float cosf = cos(f);
        float sinf = sin(f);

        float WA = wavenumber * amplitude;
        normal.x += direction.x * WA * cosf;
        normal.y += steepness * WA * sinf;
        normal.z += direction.y * WA * cosf;
        
        return vec3(
          amplitude * direction.x * cosf,
          amplitude * sinf,
          amplitude * direction.y * cosf
        );
      }
    `;
  }
}
