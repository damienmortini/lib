import GLTexture from '../GLTexture.js';
import GLTFLoader from '../GLTFLoader.js';

export default class GLGLTFObject {
  constructor({
    gl,
    src,
  }) {
    this.gl = gl;
    this.gltf = null;

    this._currentTime = 0;
    this._duration = 0;
    this._skinTextures = new Map();

    this.ready = this._load(src);
  }

  async _load(src) {
    this.gltf = await GLTFLoader.load({
      gl: this.gl,
      src,
    });

    for (const animation of this.gltf.animations) {
      this._duration = Math.max(this._duration, animation.duration);
    }

    for (const skin of this.gltf.skins ?? []) {
      const texture = new GLTexture({
        gl: this.gl,
        data: skin.jointMatricesData,
        autoGenerateMipmap: false,
        type: this.gl.FLOAT,
        internalFormat: this.gl.RGBA32F || this.gl.RGBA,
        minFilter: this.gl.NEAREST,
        magFilter: this.gl.NEAREST,
        width: skin.jointMatricesTextureSize[0],
        height: skin.jointMatricesTextureSize[1],
        flipY: false,
      });
      this._skinTextures.set(skin, texture);
    }
  }

  get duration() {
    return this._duration;
  }

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(value) {
    this._currentTime = value;
    for (const animation of this.gltf?.animations ?? []) {
      animation.currentTime = this._currentTime;
    }
  }

  draw({ uniforms }) {
    if (!this.gltf) {
      return;
    }

    const scene = this.gltf.scene ?? this.gltf.scenes[0];

    scene.updateWorldTransforms();

    for (const skin of this.gltf.skins ?? []) {
      skin.updateJointsTextureData();
      this._skinTextures.get(skin).data = skin.jointMatricesTextureData;
    }

    for (const node of scene.flattenedNodesWithMesh) {
      for (const primitive of node.mesh.primitives) {
        const object = primitive._object;
        // const object = this._primitiveObjectMap.get(primitive);
        object.draw({
          bind: true,
          uniforms: {
            transform: node.worldTransform,
            normalMatrix: node.normalMatrix,
            ...(node.weights ? { morphTargetWeights: node.weights } : null),
            ...(node.skin ? {
              jointMatricesTexture: this._skinTextures.get(node.skin),
              jointMatricesTextureSize: node.skin.jointMatricesTextureSize,
            } : null),
            ...uniforms,
          },
        });
      }
    }
  }
}
