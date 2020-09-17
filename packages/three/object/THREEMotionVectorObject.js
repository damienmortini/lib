import { Object3D, BufferGeometry, BufferAttribute, MeshBasicMaterial, AnimationMixer, DataTexture, MathUtils, RGBAFormat, FloatType, RGBFormat, Points, Color, Matrix4 } from '../../../three/src/Three.js';
import Ticker from '../../core/util/Ticker.js';
import THREEGPGPUSystem from '../../three/gpgpu/THREEGPGPUSystem.js';
import THREEShaderMaterial from '../../three/material/THREEShaderMaterial.js';

export default class THREEMotionVectorObject extends Object3D {
  constructor({
    renderer,
    pointsAttributes,
    gltfData,
    material = new THREEShaderMaterial({
      skinning: true,
      type: 'basic',
      uniforms: {
        diffuse: new Color('#ff0000'),
      },
      vertexChunks: [
        ['main', `
          gl_PointSize = 2.;
        `],
      ],
    }),
  }) {
    super();

    this._initialized = false;

    const object = gltfData.scene;
    this._mesh = object;
    object.traverse((object) => {
      if (object.skeleton) {
        this._mesh = object;
      }
    });
    this._mesh.visible = false;
    this.add(object);

    this._skeleton = this._mesh.skeleton;

    // Create bonesTexture manually
    // https://github.com/mrdoob/three.js/blob/cd41804aa436bb2cfd79797c04985f75c4c63e63/src/renderers/WebGLRenderer.js#L1632

    let size = Math.sqrt(this._skeleton.bones.length * 4); // 4 pixels needed for 1 matrix
    size = MathUtils.ceilPowerOfTwo(size);
    size = Math.max(size, 4);

    const boneMatrices = new Float32Array(size * size * 4); // 4 floats per RGBA pixel
    boneMatrices.set(this._skeleton.boneMatrices); // copy current values

    const boneTexture = new DataTexture(boneMatrices, size, size, RGBAFormat, FloatType);

    this._skeleton.boneMatrices = boneMatrices;
    this._skeleton.boneTexture = boneTexture;
    this._skeleton.boneTextureSize = size;

    //

    const geometry = new BufferGeometry();

    for (const [name, data] of pointsAttributes) {
      if (!this._pointCount) {
        this._pointCount = data.data.length / data.size;
      }
      geometry.setAttribute(name, new BufferAttribute(data.data, data.size));
    }

    this._points = new Points(geometry, material);
    this._points.isSkinnedMesh = true;
    this._points.skeleton = this._skeleton;
    this._points.bindMatrix = new Matrix4();
    this._points.bindMatrixInverse = new Matrix4();
    this._points.visible = false;
    this.add(this._points);

    const animation = gltfData.animations[0];
    this._animationMixer = new AnimationMixer(object);
    this._animationClip = animation;
    this._animationAction = this._animationMixer.clipAction(this._animationClip);
    this._animationAction.play();

    this._pointTextures = new Map();
    this._pointTextureSize = Math.ceil(Math.sqrt(this._pointCount));
    for (const [name, attributeData] of pointsAttributes) {
      const textureData = new Float32Array(this._pointTextureSize * this._pointTextureSize * attributeData.size);
      textureData.set(attributeData.data);
      const texture = new DataTexture(textureData, this._pointTextureSize, this._pointTextureSize, attributeData.size === 3 ? RGBFormat : RGBAFormat, FloatType);
      this._pointTextures.set(name, texture);
    }

    this._positionVelocitySystem = new THREEGPGPUSystem({
      data: new Float32Array((3 + 3) * this._pointCount),
      stride: 2,
      renderer: renderer,
      format: RGBFormat,
      uniforms: {
        pointsTextureSize: this.pointTextureSize,
        pointPositionTexture: this.pointTextures.get('position'),
        pointSkinIndexTexture: this.pointTextures.get('skinIndex'),
        pointSkinWeightTexture: this.pointTextures.get('skinWeight'),
        pointNormalTexture: this.pointTextures.get('normal'),
      },
      fragmentChunks: [
        ['start', `
          uniform float pointsTextureSize;
          uniform highp sampler2D pointPositionTexture;
          uniform highp sampler2D pointNormalTexture;
          uniform highp sampler2D pointSkinIndexTexture;
          uniform highp sampler2D pointSkinWeightTexture;

          uniform highp sampler2D boneTexture;
          uniform int boneTextureSize;

          mat4 getBoneMatrix( const in float i ) {
            float j = i * 4.0;
            float x = mod( j, float( boneTextureSize ) );
            float y = floor( j / float( boneTextureSize ) );
            float dx = 1.0 / float( boneTextureSize );
            float dy = 1.0 / float( boneTextureSize );
            y = dy * ( y + 0.5 );
            vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
            vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
            vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
            vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
            mat4 bone = mat4( v1, v2, v3, v4 );
            return bone;
          }
        `],
        ['end', `
          vec3 previousPosition = getDataChunk(0).xyz;
          float chunkIndex = float(getChunkIndex());

          float pointID = float(getDataIndex());

          float x = mod(pointID, pointsTextureSize);
          float y = floor(pointID / pointsTextureSize);
          float dx = 1. / pointsTextureSize;
          float dy = 1. / pointsTextureSize;
          x = dx * (x + .5);
          y = dy * (y + .5);

          vec3 position = texture(pointPositionTexture, vec2(x, y)).rgb;
          vec3 normal = texture(pointNormalTexture, vec2(x, y)).rgb;
          vec4 skinIndex = texture(pointSkinIndexTexture, vec2(x, y));
          vec4 skinWeight = texture(pointSkinWeightTexture, vec2(x, y));

          mat4 boneMatX = getBoneMatrix( skinIndex.x );
          mat4 boneMatY = getBoneMatrix( skinIndex.y );
          mat4 boneMatZ = getBoneMatrix( skinIndex.z );
          mat4 boneMatW = getBoneMatrix( skinIndex.w );

          vec4 skinVertex = vec4( position, 1.0 );
          vec4 skinned = vec4( 0.0 );
          skinned += boneMatX * skinVertex * skinWeight.x;
          skinned += boneMatY * skinVertex * skinWeight.y;
          skinned += boneMatZ * skinVertex * skinWeight.z;
          skinned += boneMatW * skinVertex * skinWeight.w;
          
          position = skinned.xyz;

          mat4 skinMatrix = mat4(0.);
          skinMatrix += skinWeight.x * boneMatX;
          skinMatrix += skinWeight.y * boneMatY;
          skinMatrix += skinWeight.z * boneMatZ;
          skinMatrix += skinWeight.w * boneMatW;
          normal = vec4(skinMatrix * vec4(normal, 0.)).xyz;

          vec3 velocity = position - previousPosition;

          gl_FragColor = vec4(mix(position, velocity, chunkIndex), 1.);
        `],
      ],
    });
    this._positionVelocitySystem.onBeforeRender = () => {
      this._positionVelocitySystem.material.boneTexture = this.boneTexture;
      this._positionVelocitySystem.material.boneTextureSize = this.boneTextureSize;
    };
  }

  get pointCount() {
    return this._pointCount;
  }

  get pointTextureSize() {
    return this._pointTextureSize;
  }

  get pointTextures() {
    return this._pointTextures;
  }

  get boneTexture() {
    return this._skeleton.boneTexture;
  }

  get boneTextureSize() {
    return this._skeleton.boneTextureSize;
  }

  get positionVelocityDataTexture() {
    return this._positionVelocitySystem.dataTexture;
  }

  get positionVelocityDataTextureStride() {
    return this._positionVelocitySystem.stride;
  }

  get positionVelocityDataTextureWidth() {
    return this._positionVelocitySystem.dataTextureWidth;
  }

  get positionVelocityDataTextureHeight() {
    return this._positionVelocitySystem.dataTextureHeight;
  }

  get positionVelocityDataTextureSize() {
    return [this._positionVelocitySystem.dataTextureWidth, this._positionVelocitySystem.dataTextureHeight];
  }

  get meshVisible() {
    return this._mesh.visible;
  }

  set meshVisible(value) {
    this._mesh.visible = value;
  }

  get pointsVisible() {
    return this._points.visible;
  }

  set pointsVisible(value) {
    this._points.visible = value;
  }

  update() {
    this._animationMixer.update(Ticker.deltaTime);
    if (!this._points.visible && !this._mesh.visible) {
      this._skeleton.update();
    }
    if (!this._initialized) {
      this._positionVelocitySystem.update();
      this._initialized = true;
    }
    this._positionVelocitySystem.update();
  }
}
