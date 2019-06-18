// From https://catlikecoding.com/unity/tutorials/flow/waves/

export default class GerstnerWaveShader {
  static get GerstnerWave() {
    return `
      struct GerstnerWave {
        vec2 direction;
        float steepness;
        float wavelength;
      };
    `;
  }

  static gerstnerWave() {
    return `
      vec3 gerstnerWave(GerstnerWave wave, vec2 position, float time, inout vec3 normal) {
        float steepness = wave.steepness;
        float wavelength = wave.wavelength;
        vec2 direction = normalize(wave.direction);
        
        float wavenumber = 2. * 3.14159265359 / wavelength;
        float speed = sqrt(9.8 / wavenumber);
        float amplitude = steepness / wavenumber;
        float f = wavenumber * (dot(direction, position) - speed * time);

        float cosf = cos(f);
        float sinf = sin(f);

        float WA = wavenumber * amplitude;
        normal.x -= direction.x * WA * cosf;
        normal.y -= steepness * WA * sinf;
        normal.z -= direction.y * WA * cosf;
        
        return vec3(
          amplitude * direction.x * cosf,
          amplitude * sinf,
          amplitude * direction.y * cosf
        );
      }
    `;
  }
}
