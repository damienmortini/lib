export default class FractalBrownianMotion {
  static fbmDerivatives3D({
    noiseFunctionName,
    octaves = 5,
  }) {
    return `
      vec4 fbmDerivatives3D( in vec3 x ) 
      {
        float f = 2.;
        float s = 0.5;
        float a = 0.0;
        float b = 0.5;
        vec3  d = vec3(0.0);
        mat3  m = mat3(1.0,0.0,0.0,
                      0.0,1.0,0.0,
                      0.0,0.0,1.0);
        for( int i=0; i < ${octaves}; i++ )
        {
            vec4 n = ${noiseFunctionName}(x);
            a += b*n.x;          // accumulate values
            d += b*m*n.yzw;      // accumulate derivatives
            b *= s;
            x = f*x;
            m = f*m;
        }
        return vec4( a, d );
      }
    `;
  }
}
