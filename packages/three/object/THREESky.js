import { BackSide } from "../../../three/src/constants.js";
import { Mesh } from "../../../three/src/objects/Mesh.js";
import { Vector3 } from "../../../three/src/math/Vector3.js";
import { IcosahedronBufferGeometry } from "../../../three/src/geometries/IcosahedronGeometry.js";
import THREEShaderMaterial from "../material/THREEShaderMaterial.js";

/**
 * @author zz85 / https://github.com/zz85
 *
 * Based on "A Practical Analytic Model for Daylight"
 * aka The Preetham Model, the de facto standard analytic skydome model
 * http://www.cs.utah.edu/~shirley/papers/sunsky/sunsky.pdf
 *
 * First implemented by Simon Wallner
 * http://www.simonwallner.at/projects/atmospheric-scattering
 *
 * Improved by Martin Upitis
 * http://blenderartists.org/forum/showthread.php?245954-preethams-sky-impementation-HDR
 *
 * Three.js integration by zz85 http://twitter.com/blurspline
*/

const skyShader = {
  uniforms: {
    luminance: 1,
    turbidity: 2,
    rayleigh: 1,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    sunPosition: new Vector3(0, 1, 0),
  },
  vertexShaderChunks: [
    ["start", `
      uniform vec3 sunPosition;
      uniform float rayleigh;
      uniform float turbidity;
      uniform float mieCoefficient;

      varying vec3 vWorldPosition;
      varying vec3 vSunDirection;
      varying float vSunfade;
      varying vec3 vBetaR;
      varying vec3 vBetaM;
      varying float vSunE;
    `],
    ["end", `
      const vec3 up = vec3( 0.0, 1.0, 0.0 );

      // constants for atmospheric scattering
      const float e = 2.71828182845904523536028747135266249775724709369995957;
      const float pi = 3.141592653589793238462643383279502884197169;

      // wavelength of used primaries, according to preetham
      const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
      // this pre-calcuation replaces older TotalRayleigh(vec3 lambda) function:
      // (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
      const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

      // mie stuff
      // K coefficient for the primaries
      const float v = 4.0;
      const vec3 K = vec3( 0.686, 0.678, 0.666 );
      // MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
      const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

      // earth shadow hack
      // cutoffAngle = pi / 1.95;
      const float cutoffAngle = 1.6110731556870734;
      const float steepness = 1.5;
      const float EE = 1000.0;

      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
      vWorldPosition = worldPosition.xyz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

      vSunDirection = normalize( sunPosition );

      // Sun Intensity
      float zenithAngleCos = clamp( dot( vSunDirection, up ), -1.0, 1.0 );
      vSunE = EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );;

      vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

      float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

      // extinction (absorbtion + out scattering)
      // rayleigh coefficients
      vBetaR = totalRayleigh * rayleighCoefficient;

      // mie coefficients
      float c = ( 0.2 * turbidity ) * 10E-18;
      vec3 totalMie = 0.434 * c * MieConst;
      vBetaM = totalMie * mieCoefficient;
    `]
  ],
  fragmentShaderChunks: [
    ["start", `
      varying vec3 vWorldPosition;
      varying vec3 vSunDirection;
      varying float vSunfade;
      varying vec3 vBetaR;
      varying vec3 vBetaM;
      varying float vSunE;

      uniform float luminance;
      uniform float mieDirectionalG;
    `],
    ["end", `
      const vec3 cameraPos = vec3( 0.0, 0.0, 0.0 );

      // constants for atmospheric scattering
      const float pi = 3.141592653589793238462643383279502884197169;

      const float n = 1.0003; // refractive index of air
      const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

      // optical length at zenith for molecules
      const float rayleighZenithLength = 8.4E3;
      const float mieZenithLength = 1.25E3;
      const vec3 up = vec3( 0.0, 1.0, 0.0 );
      // 66 arc seconds -> degrees, and the cosine of that
      const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

      // 3.0 / ( 16.0 * pi )
      const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
      // 1.0 / ( 4.0 * pi )
      const float ONE_OVER_FOURPI = 0.07957747154594767;

      // optical length
      // cutoff angle at 90 to avoid singularity in next formula.
      float zenithAngle = acos( max( 0.0, dot( up, normalize( vWorldPosition - cameraPos ) ) ) );
      float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
      float sR = rayleighZenithLength * inverse;
      float sM = mieZenithLength * inverse;

      // combined extinction factor
      vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

      // in scattering
      float cosTheta = dot( normalize( vWorldPosition - cameraPos ), vSunDirection );

      // Rayleigh Phase
      float rPhase = THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta * 0.5 + 0.5, 2.0 ) );
      vec3 betaRTheta = vBetaR * rPhase;

      // Hg Phase
      float g2 = pow( mieDirectionalG, 2.0 );
      float inverseHg = 1.0 / pow( 1.0 - 2.0 * mieDirectionalG * cosTheta + g2, 1.5 );
      float mPhase = ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverseHg );
      vec3 betaMTheta = vBetaM * mPhase;

      vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
      Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

      // nightsky
      vec3 direction = normalize( vWorldPosition - cameraPos );
      float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
      float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
      vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
      vec3 L0 = vec3( 0.1 ) * Fex;

      // composition + solar disc
      float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
      L0 += ( vSunE * 19000.0 * Fex ) * sundisk;

      vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

      // Tone Mapping

      vec3 uncharted = ( log2( 2.0 / pow( luminance, 4.0 ) ) ) * texColor;

      // Filmic ToneMapping http://filmicgames.com/archives/75
      const float A = 0.15;
      const float B = 0.50;
      const float C = 0.10;
      const float D = 0.20;
      const float E = 0.02;
      const float F = 0.30;

      const float whiteScale = 1.0748724675633854; // 1.0 / Uncharted2Tonemap(1000.0)

      vec3 curr = ( ( uncharted * ( A * uncharted + C * B ) + D * E ) / ( uncharted * ( A * uncharted + B ) + D * F ) ) - E / F;
      vec3 color = curr * whiteScale;

      // Final
      vec3 retColor = pow( color, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

      gl_FragColor = vec4( retColor, 1.0 );
    `]
  ]
};

export default class Sky extends Mesh {
  constructor({ radius = 1 } = {}) {
    super(new IcosahedronBufferGeometry(radius, 3), new THREEShaderMaterial({
      type: "basic",
      side: BackSide,
      ...skyShader
    }));

    this._radius = radius;

    this.sunInclination = Math.PI * .5;
    this.sunAzimuth = 0;
  }

  _updatePositionFromInclinationAzimuth(position, inclination, azimuth) {
    const theta = inclination;
    const phi = azimuth + Math.PI * .5;
    position.x = this._radius * Math.cos(phi) * Math.cos(theta);
    position.y = this._radius * Math.sin(theta);
    position.z = this._radius * Math.sin(phi) * Math.cos(theta);
  }

  get sunInclination() {
    return this._sunInclination;
  }

  set sunInclination(value) {
    this._sunInclination = value;
    this._updatePositionFromInclinationAzimuth(this.sunPosition, this.sunInclination, this.sunAzimuth);
  }

  get sunAzimuth() {
    return this._sunAzimuth;
  }

  set sunAzimuth(value) {
    this._sunAzimuth = value;
    this._updatePositionFromInclinationAzimuth(this.sunPosition, this.sunInclination, this.sunAzimuth);
  }

  get sunPosition() {
    return this.material.sunPosition;
  }

  set sunPosition(value) {
    this.material.sunPosition = value;
  }
}
