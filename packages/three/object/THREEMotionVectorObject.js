import { Object3D, BufferGeometry, BufferAttribute, AnimationMixer, DataTexture, RGBAFormat, FloatType, RGBFormat, Points, Color, Matrix4 } from '../../../three/src/Three.js'
import TransformShader from '../../core/shader/TransformShader.js'
import THREEGPGPUSystem from '../../three/gpgpu/THREEGPGPUSystem.js'
import THREEShaderMaterial from '../../three/material/THREEShaderMaterial.js'

export default class THREEMotionVectorObject extends Object3D {
  constructor({
    renderer,
    gltfData,
    pointsAttributes = undefined,
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
    pointCount = undefined,
  }) {
    super()

    this.loop = false

    this._pointCount = pointCount

    this._initialized = false

    const object = gltfData.scene
    this._mesh = object
    object.traverse((object) => {
      if (object.skeleton) {
        this._mesh = object
        this._mesh.frustumCulled = false
      }
    })
    // this._mesh.visible = false;
    this._mesh.scale.set(0, 0, 0)
    if (!pointsAttributes) {
      pointsAttributes = new Map()
      for (const [name, value] of Object.entries(this._mesh.geometry.attributes)) {
        pointsAttributes.set(name, {
          data: value.array,
          size: value.itemSize,
        })
      }
    }
    this.add(object)

    if (this._pointCount) {
      for (const attributeData of pointsAttributes.values()) {
        const newArray = new attributeData.data.constructor(this._pointCount * attributeData.size)
        const stride = attributeData.size
        const difference = Math.floor(attributeData.data.length / newArray.length)
        for (let index = 0; index < this._pointCount; index++) {
          for (let componentIndex = 0; componentIndex < stride; componentIndex++) {
            newArray[index * stride + componentIndex] = attributeData.data[index * stride * difference + componentIndex]
          }
        }
        attributeData.data = newArray
      }
    } else {
      const firstAttribute = pointsAttributes.values().next().value
      this._pointCount = firstAttribute.data.length / firstAttribute.size
    }

    this._skeleton = this._mesh.skeleton

    // Create bonesTexture manually
    // https://github.com/mrdoob/three.js/blob/cd41804aa436bb2cfd79797c04985f75c4c63e63/src/renderers/WebGLRenderer.js#L1632

    // let size = Math.sqrt(this._skeleton.bones.length * 4); // 4 pixels needed for 1 matrix
    // size = MathUtils.ceilPowerOfTwo(size);
    // size = Math.max(size, 4);

    // const boneMatrices = new Float32Array(size * size * 4); // 4 floats per RGBA pixel
    // boneMatrices.set(this._skeleton.boneMatrices); // copy current values

    // let boneTexture;
    // if (renderer.capabilities.isWebGL2) {
    //   boneTexture = new DataTexture(boneMatrices, size, size, RGBAFormat, FloatType);
    // } else {
    //   boneTexture = new DataTexture(Float16.fromFloat32Array(boneMatrices), size, size, RGBAFormat, HalfFloatType);
    // }

    // this._skeleton.boneMatrices = boneMatrices;
    // this._skeleton.boneTexture = boneTexture;
    // this._skeleton.boneTextureSize = size;

    //

    const geometry = new BufferGeometry()

    for (const [name, attributeData] of pointsAttributes) {
      geometry.setAttribute(name, new BufferAttribute(attributeData.data, attributeData.size))
    }

    this._points = new Points(geometry, material)
    this._points.isSkinnedMesh = true
    this._points.skeleton = this._skeleton
    this._points.bindMatrix = new Matrix4()
    this._points.bindMatrixInverse = new Matrix4()
    this._points.visible = false
    this._points.frustumCulled = false
    this.add(this._points)

    const animation = gltfData.animations[0]
    this._animationMixer = new AnimationMixer(object)
    this._animationClip = animation
    this._animationAction = this._animationMixer.clipAction(this._animationClip)
    this._animationAction.play()

    const pointTextures = new Map()
    const pointTextureSize = Math.ceil(Math.sqrt(this._pointCount))
    for (const [name, attributeData] of pointsAttributes) {
      const textureData = new Float32Array(pointTextureSize * pointTextureSize * attributeData.size)
      textureData.set(attributeData.data)
      const texture = new DataTexture(textureData, pointTextureSize, pointTextureSize, attributeData.size === 3 ? RGBFormat : RGBAFormat, FloatType)
      pointTextures.set(name, texture)
    }

    this._gpgpuSystem = new THREEGPGPUSystem({
      data: new Float32Array((4 * 3) * this._pointCount),
      stride: 3,
      renderer: renderer,
      format: RGBAFormat,
      uniforms: {
        pointsTextureSize: pointTextureSize,
        pointPositionTexture: pointTextures.get('position'),
        pointSkinIndexTexture: pointTextures.get('skinIndex'),
        pointSkinWeightTexture: pointTextures.get('skinWeight'),
        pointNormalTexture: pointTextures.get('normal'),
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

          ${TransformShader.quaternionFromMatrix()}

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
          int chunkIndex = getChunkIndex();

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

          vec4 data;
          if(chunkIndex < 2) {
            vec4 skinVertex = vec4( position, 1.0 );
            vec4 skinned = vec4( 0.0 );
            skinned += boneMatX * skinVertex * skinWeight.x;
            skinned += boneMatY * skinVertex * skinWeight.y;
            skinned += boneMatZ * skinVertex * skinWeight.z;
            skinned += boneMatW * skinVertex * skinWeight.w;
            
            position = skinned.xyz;

            vec3 velocity = position - previousPosition;

            if(chunkIndex == 0) {
              data = vec4(position, 0.);
            } else if(chunkIndex == 1) {
              data = vec4(velocity, 0.);
            }
          } else if(chunkIndex == 2) {
            mat4 rotationMatrix = mat4(0.);
            rotationMatrix += skinWeight.x * boneMatX;
            rotationMatrix += skinWeight.y * boneMatY;
            rotationMatrix += skinWeight.z * boneMatZ;
            rotationMatrix += skinWeight.w * boneMatW;
            vec4 quaternion = quaternionFromMatrix(rotationMatrix);
            data = quaternion;
          }
          gl_FragColor = data;
        `],
      ],
    })
    this._gpgpuSystem.onBeforeRender = () => {
      this._gpgpuSystem.material.boneTexture = this._skeleton.boneTexture
      this._gpgpuSystem.material.boneTextureSize = this._skeleton.boneTextureSize
    }
  }

  get pointCount() {
    return this._pointCount
  }

  get dataTexture() {
    return this._gpgpuSystem.dataTexture
  }

  get dataTextureStride() {
    return this._gpgpuSystem.stride
  }

  get dataTextureSize() {
    return this._gpgpuSystem.dataTextureSize
  }

  get meshVisible() {
    return this._mesh.visible
  }

  set meshVisible(value) {
    this._mesh.visible = value
  }

  get pointsVisible() {
    return this._points.visible
  }

  set pointsVisible(value) {
    this._points.visible = value
  }

  get currentTime() {
    return this._animationMixer.time
  }

  set currentTime(value) {
    if (value >= this._animationClip.duration) {
      if (this.loop) {
        value = 0
      } else {
        value = this._animationClip.duration
      }
    }
    this._animationMixer.setTime(Math.min(value, this._animationClip.duration - .01))
    this._update()
  }

  _update() {
    if (!this._points.visible && !this._mesh.visible) {
      this._skeleton.update()
    }
    if (!this._initialized) {
      this._gpgpuSystem.update()
      this._initialized = true
    }
    this._gpgpuSystem.update()
  }
}
