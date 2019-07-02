import { BackSide } from "../../../three/src/constants.js";
import { Mesh } from "../../../three/src/objects/Mesh.js";
import { Vector3 } from "../../../three/src/math/Vector3.js";
import { IcosahedronBufferGeometry } from "../../../three/src/geometries/IcosahedronGeometry.js";
import THREEShaderMaterial from "../material/THREEShaderMaterial.js";
import SkyShader from "../../lib/shader/SkyShader.js";

const skyShader = {
  uniforms: {
    sunPosition: new Vector3(0, 1, 0),
    sunLuminance: 1,
    sunTurbidity: 2,
    sunRayleigh: 1,
    sunMieCoefficient: 0.005,
    sunMieDirectionalG: 0.8,
    moonPosition: new Vector3(0, 1, 0),
    moonLuminance: 1,
    moonTurbidity: 2,
    moonRayleigh: 0,
    moonMieCoefficient: 0.005,
    moonMieDirectionalG: 0.8,
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

      uniform vec3 moonPosition;
      uniform float moonRayleigh;
      uniform float moonTurbidity;
      uniform float moonLuminance;
      uniform float moonMieCoefficient;
      uniform float moonMieDirectionalG;

      varying vec3 vWorldPosition;

      ${SkyShader.computeSkyColor()}
    `],
    ["end", `
      
      vec3 skyColor = computeSkyColor(vWorldPosition, sunPosition, sunRayleigh, sunTurbidity, sunLuminance, sunMieCoefficient, sunMieDirectionalG);
      skyColor += computeSkyColor(vWorldPosition, moonPosition, moonRayleigh, moonTurbidity, moonLuminance, moonMieCoefficient, moonMieDirectionalG);

      gl_FragColor = vec4( skyColor, 1.0 );
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
}
