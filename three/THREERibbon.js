import THREE from "three";

import THREEExtendedShaderMaterial from "./THREEExtendedShaderMaterial.js";

const POINTS_NUMBER = 1000;

const TEXTURE_WIDTH = 128;
const TEXTURE_HEIGHT = 128;

const TEXTURE = new THREE.DataTexture(new Float32Array(TEXTURE_WIDTH * TEXTURE_HEIGHT * 4), TEXTURE_WIDTH, TEXTURE_HEIGHT, THREE.RGBAFormat, THREE.FloatType);
TEXTURE.needsUpdate = true;

let DATA_OFFSET = 0;

export default class Ribbon extends THREE.Mesh {
  constructor(geometry = new THREE.CylinderBufferGeometry(1, 1, 1000, 6, 999) , material = new THREE.MeshBasicMaterial()) {
    let positionsArray = geometry.getAttribute("position").array;

    let idsArray = new Float32Array(positionsArray.length / 3);

    let maxY = -Infinity;
    let minY = Infinity;

    let segments = -1;

    for (let i = 0; i < positionsArray.length / 3; i++) {
      let y = positionsArray[i * 3 + 1];
      if (y > maxY || y < minY) {
        maxY = y > maxY ? y : maxY;
        minY = y < minY ? y : minY;
        segments++;
      }
      positionsArray[i * 3 + 1] = 0;
      idsArray[i] = segments;
    }

    geometry.addAttribute("ribbonId", new THREE.BufferAttribute(idsArray, 1));

    material = new THREEExtendedShaderMaterial("normal", {
      vertexShaderHooks: {
        prefix: `
          #define POINTS_NUMBER ${POINTS_NUMBER}.0
          #define TEXTURE_WIDTH ${TEXTURE_WIDTH}.0
          #define TEXTURE_HEIGHT ${TEXTURE_HEIGHT}.0

          uniform float offsetID;
          uniform float dataOffset;

          uniform sampler2D data;

          attribute float ribbonId;

          mat3 matrixFromEuler(vec3 euler) {
            mat3 m;

            float a = cos(euler.x);
            float b = sin(euler.x);
            float c = cos(euler.y);
            float d = sin(euler.y);
            float e = cos(euler.z);
            float f = sin(euler.z);

            float ae = a * e;
            float af = a * f;
            float be = b * e;
            float bf = b * f;

            m[0][0] = c * e;
            m[0][1] = - c * f;
            m[0][2] = d;

            m[1][0] = af + be * d;
            m[1][1] = ae - bf * d;
            m[1][2] = - b * c;

            m[2][0] = bf - ae * d;
            m[2][1] = be + af * d;
            m[2][2] = a * c;

            return m;
          }`,
        main: `
            vec3 position = position;

            float pointID = mod(ribbonId + offsetID, POINTS_NUMBER) + dataOffset;

            vec4 dataChunk1 = texture2D(data, vec2(mod(pointID, TEXTURE_WIDTH * .5) / TEXTURE_WIDTH * 2., floor(pointID / TEXTURE_WIDTH * 2.) / TEXTURE_HEIGHT));
            vec4 dataChunk2 = texture2D(data, vec2(mod(pointID + .5, TEXTURE_WIDTH * .5) / TEXTURE_WIDTH * 2., floor((pointID + .5) / TEXTURE_WIDTH * 2.) / TEXTURE_HEIGHT));

            vec3 point = dataChunk1.xyz;
            vec3 rotation = dataChunk2.xyz;

            mat3 rotationMatrix = matrixFromEuler(rotation);
            position *= rotationMatrix;

            position += point;
          `,
        suffix: `
            #ifndef FLAT_SHADED
            vNormal *= rotationMatrix;
            #endif
          `
      }
    });
    material.uniforms.data.value = TEXTURE;
    material.uniforms.dataOffset.value = DATA_OFFSET;
    material.side = THREE.DoubleSide;

    super(geometry, material);

    this.length = maxY - minY;

    this._time = 0;
    this._bufferOffset = 0;

    this._matrix4Cached1 = new THREE.Matrix4();
    this._eulerCached1 = new THREE.Euler();
    this._vector3Cached1 = new THREE.Vector3();

    this._direction = new THREE.Vector3();
    this._normal = new THREE.Vector3();
    this._binormal = new THREE.Vector3();

    this._previousPosition = new THREE.Vector3();
    this._previousBinormal = new THREE.Vector3();

    // let uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
    // Object.assign(uniforms, {
    //   offsetID: {
    //     type: "f",
    //     value: 0
    //   },
    //   color: {
    //     type: "c",
    //     value: new THREE.Color(color)
    //   },
    //   tipColor: {
    //     type: "c",
    //     value: new THREE.Color(tipColor)
    //   },
    //   scale: {
    //     type: "f",
    //     value: 1
    //   },
    //   emissiveIntensity: {
    //     type: "f",
    //     value: 0
    //   },
    //   data: {
    //     type: "t",
    //     value: TEXTURE
    //   },
    //   dataOffset: {
    //     type: "f",
    //     value: DATA_OFFSET
    //   }
    // });

    // let material = new THREE.ShaderMaterial({
    //   uniforms: uniforms,
    //   vertexShader: ShaderUtils.replaceThreeChunks(VERTEX_SHADER),
    //   fragmentShader: ShaderUtils.replaceThreeChunks(FRAGMENT_SHADER)
    // });

    // this = new THREE.Mesh(geometry, material);
    // this.material.lights = true;
    // this.material.transparent = true;
    //
    // this.add(this);

    DATA_OFFSET += POINTS_NUMBER;

    this.frustumCulled = false;
  }

  update(position) {

    let dataOffset = this.material.uniforms.dataOffset.value * 8;

    this._direction.copy(position).sub(this._previousPosition).normalize();

    if(!this._direction.length()) {
      return;
    }

    if (this._time === 0) {
      for (let i = 0; i < POINTS_NUMBER * 8; i += 8) {
        TEXTURE.image.data[i + dataOffset] = position.x;
        TEXTURE.image.data[i + 1 + dataOffset] = position.y;
        TEXTURE.image.data[i + 2 + dataOffset] = position.z;
      }
      this._normal.crossVectors(this._direction, new THREE.Vector3(1, 0, 0)).normalize();
    } else {
      this._normal.crossVectors(this._previousBinormal, this._direction).normalize();
    }

    this._binormal.crossVectors(this._direction, this._normal).normalize();

    this._matrix4Cached1.set(
      this._binormal.x,
      this._direction.x,
      this._normal.x,
      0,

      this._binormal.y,
      this._direction.y,
      this._normal.y,
      0,

      this._binormal.z,
      this._direction.z,
      this._normal.z,
      0,

      0,
      0,
      0,
      1
    );

    this._eulerCached1.setFromRotationMatrix(this._matrix4Cached1);

    this._time += .1;

    let positionDifference = this._vector3Cached1.copy(position).sub(this._previousPosition);

    for (let i = 0; i < POINTS_NUMBER * 8; i += 8) {
      let offset = dataOffset + i;
      TEXTURE.image.data[offset] = TEXTURE.image.data[offset] - positionDifference.x;
      TEXTURE.image.data[offset + 1] = TEXTURE.image.data[offset + 1] - positionDifference.y;
      TEXTURE.image.data[offset + 2] = TEXTURE.image.data[offset + 2] - positionDifference.z;
    }

    TEXTURE.image.data[this._bufferOffset + dataOffset] = 0;
    TEXTURE.image.data[this._bufferOffset + 1 + dataOffset] = 0;
    TEXTURE.image.data[this._bufferOffset + 2 + dataOffset] = 0;

    TEXTURE.image.data[this._bufferOffset + 4 + dataOffset] = this._eulerCached1.x;
    TEXTURE.image.data[this._bufferOffset + 5 + dataOffset] = this._eulerCached1.y;
    TEXTURE.image.data[this._bufferOffset + 6 + dataOffset] = this._eulerCached1.z;

    this.material.uniforms.offsetID.value += 1;
    this.material.uniforms.offsetID.value %= POINTS_NUMBER;

    this._bufferOffset += 8;
    this._bufferOffset %= POINTS_NUMBER * 8;

    TEXTURE.needsUpdate = true;

    this._previousBinormal.copy(this._binormal);
    this._previousPosition.copy(position);

    this.position.copy(position);
  }
}
