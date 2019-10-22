import { BackSide } from "../../../three/src/constants.js";
import { Mesh } from "../../../three/src/objects/Mesh.js";
import { Vector3 } from "../../../three/src/math/Vector3.js";
import { IcosahedronBufferGeometry } from "../../../three/src/geometries/IcosahedronGeometry.js";
import THREEShaderMaterial from "../material/THREEShaderMaterial.js";
import SkyShader from "../../lib/shader/SkyShader.js";
import GradientNoiseShader from "../../lib/shader/noise/GradientNoiseShader.js";

const skyShader = {
  uniforms: {
    sunPosition: new Vector3(0, 1, 0),
    sunRayleigh: 1.5,
    sunTurbidity: 6,
    sunLuminance: 1,
    sunMieCoefficient: 0.005,
    sunMieDirectionalG: 0.8,
    moonPosition: new Vector3(0, 1, 0),
    moonRayleigh: 0,
    moonTurbidity: 1.5,
    moonLuminance: 1.1,
    moonMieCoefficient: 0.005,
    moonMieDirectionalG: 0.8,
    displaySun: 1,
    displayMoon: 1,
  },
  vertexShaderChunks: [
    ["start", `
      varying vec3 vWorldPosition;
    `],
    ["end", `
      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
      vWorldPosition = worldPosition.xyz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    `]
  ],
  fragmentShaderChunks: [
    ["start", `
      uniform vec3 sunPosition;
      uniform float sunRayleigh;
      uniform float sunTurbidity;
      uniform float sunLuminance;
      uniform float sunMieCoefficient;
      uniform float sunMieDirectionalG;
      uniform float displaySun;
      uniform float displayMoon;

      uniform vec3 moonPosition;
      uniform float moonRayleigh;
      uniform float moonTurbidity;
      uniform float moonLuminance;
      uniform float moonMieCoefficient;
      uniform float moonMieDirectionalG;

      varying vec3 vWorldPosition;

      ${SkyShader.computeSkyColor()}

      ${GradientNoiseShader.gradientNoise3D()}

      float blendScreen(float base, float blend) {
        return 1.0-((1.0-base)*(1.0-blend));
      }
      
      vec3 blendScreen(vec3 base, vec3 blend) {
        return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
      }
    `],
    ["end", `
      vec3 normalizedSunPosition = normalize(sunPosition);
      vec3 normalizedMoonPosition = normalize(moonPosition);
      
      vec4 skySunColor = computeSkyColor(vWorldPosition, normalizedSunPosition, ${SkyShader.SUN_ANGULAR_DIAMETER} * displaySun, sunRayleigh, sunTurbidity, sunLuminance, sunMieCoefficient, sunMieDirectionalG);
      vec4 skyMoonColor = computeSkyColor(vWorldPosition, normalizedMoonPosition, ${SkyShader.MOON_ANGULAR_DIAMETER} * displayMoon, moonRayleigh, moonTurbidity, moonLuminance, moonMieCoefficient, moonMieDirectionalG);

      float nightIntensity = 1. - smoothstep(-.05, 0., normalizedSunPosition.y);

      float moonIntensity = max(0., -dot(normalize(sunPosition.xz), normalize(moonPosition.xz)));
      // skyMoonColor *= moonIntensity;
      skyMoonColor *= nightIntensity;

      // Stars
      vec3 rayDirection = normalize(vWorldPosition);
      float starsIntensity = gradientNoise3D(rayDirection * 400.) * .5 + .5;
      starsIntensity = pow(starsIntensity, 15.);
      starsIntensity *= max(0., rayDirection.y);
      starsIntensity *= 10.;
      starsIntensity *= nightIntensity;

      skyMoonColor.rgb = blendScreen(skyMoonColor.rgb, vec3(starsIntensity));

      vec3 skyColor = blendScreen(skySunColor.rgb, skyMoonColor.rgb);

      // gl_FragColor = vec4(skyColor, (skySunColor.a + skyMoonColor.a) / 2.);
      gl_FragColor = vec4(skyColor, 1.);
    `]
  ]
};

export default class Sky extends Mesh {
  constructor({ 
    radius = 1,
    shaders = [],
  } = {}) {
    super(new IcosahedronBufferGeometry(radius, 3), new THREEShaderMaterial(Object.assign({
      type: "basic",
      side: BackSide,
      shaders,
    }, skyShader)));

    this._radius = radius;

    this.sunInclination = Math.PI * .5;
    this.sunAzimuth = 0;

    this.moonInclination = Math.PI * .5;
    this.moonAzimuth = Math.PI;
  }

  get radius() {
    return this._radius;
  }

  _updatePositionFromInclinationAzimuth(position, inclination, azimuth) {
    const theta = inclination;
    const phi = azimuth + Math.PI * .5;
    position.x = this._radius * Math.cos(phi) * Math.cos(theta);
    position.y = this._radius * Math.sin(theta);
    position.z = this._radius * Math.sin(phi) * Math.cos(theta);
  }

  get displaySun() {
    return this.material.displaySun === 1;
  }

  set displaySun(value) {
    this.material.displaySun = value ? 1 : 0;
  }

  get displayMoon() {
    return this.material.displayMoon === 1;
  }

  set displayMoon(value) {
    this.material.displayMoon = value ? 1 : 0;
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

  get sunRayleigh() {
    return this.material.sunRayleigh;
  }

  set sunRayleigh(value) {
    this.material.sunRayleigh = value;
  }

  get sunTurbidity() {
    return this.material.sunTurbidity;
  }

  set sunTurbidity(value) {
    this.material.sunTurbidity = value;
  }

  get sunLuminance() {
    return this.material.sunLuminance;
  }

  set sunLuminance(value) {
    this.material.sunLuminance = value;
  }

  get sunMieCoefficient() {
    return this.material.sunMieCoefficient;
  }

  set sunMieCoefficient(value) {
    this.material.sunMieCoefficient = value;
  }

  get sunMieDirectionalG() {
    return this.material.sunMieDirectionalG;
  }

  set sunMieDirectionalG(value) {
    this.material.sunMieDirectionalG = value;
  }

  get moonInclination() {
    return this._moonInclination;
  }

  set moonInclination(value) {
    this._moonInclination = value;
    this._updatePositionFromInclinationAzimuth(this.moonPosition, this.moonInclination, this.moonAzimuth);
  }

  get moonAzimuth() {
    return this._moonAzimuth;
  }

  set moonAzimuth(value) {
    this._moonAzimuth = value;
    this._updatePositionFromInclinationAzimuth(this.moonPosition, this.moonInclination, this.moonAzimuth);
  }

  get moonPosition() {
    return this.material.moonPosition;
  }

  set moonPosition(value) {
    this.material.moonPosition = value;
  }

  get moonRayleigh() {
    return this.material.moonRayleigh;
  }

  set moonRayleigh(value) {
    this.material.moonRayleigh = value;
  }

  get moonTurbidity() {
    return this.material.moonTurbidity;
  }

  set moonTurbidity(value) {
    this.material.moonTurbidity = value;
  }

  get moonLuminance() {
    return this.material.moonLuminance;
  }

  set moonLuminance(value) {
    this.material.moonLuminance = value;
  }

  get moonMieCoefficient() {
    return this.material.moonMieCoefficient;
  }

  set moonMieCoefficient(value) {
    this.material.moonMieCoefficient = value;
  }

  get moonMieDirectionalG() {
    return this.material.moonMieDirectionalG;
  }

  set moonMieDirectionalG(value) {
    this.material.moonMieDirectionalG = value;
  }
}
