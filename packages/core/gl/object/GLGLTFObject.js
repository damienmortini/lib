import GLTFShader from '../../shader/GLTFShader.js';
import GLBuffer from '../GLBuffer.js';
import GLMesh from '../GLMesh.js';
import GLObject from '../GLObject.js';
import GLProgram from '../GLProgram.js';
import GLTexture from '../GLTexture.js';
import GLTFLoader from '../GLTFLoader.js';
import GLVertexAttribute from '../GLVertexAttribute.js';

export default class GLGLTFObject {
  constructor({
    gl,
    src,
  }) {
    this.gl = gl;
    this.gltf = null;

    this._currentTime = 0;
    this._duration = 0;
    this._skinTextureMap = new Map();
    this._materialProgramMap = new Map();
    this._primitiveObjectMap = new Map();

    this.ready = this._load(src);
  }

  async _load(src) {
    this.gltf = await GLTFLoader.load({
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
      this._skinTextureMap.set(skin, texture);
    }

    const defaultProgram = new GLProgram({
      gl: this.gl,
      shader: new GLTFShader({
        fragmentChunks: [
          ['end', `
            fragColor = vec4(vNormal * .5 + .5, 1.);
          `],
        ],
      }),
    });
    for (const material of this.gltf.materials ?? []) {
      const program = new GLProgram({
        gl: this.gl,
        shader: new GLTFShader({
          fragmentChunks: [
            ['end', `
              fragColor = vec4(vNormal * .5 + .5, 1.);
            `],
          ],
        }),
      });
      this._materialProgramMap.set(material, program);
    }

    for (const mesh of this.gltf.meshes) {
      for (const primitive of mesh.primitives) {
        const vertexAttributes = new Map();
        for (const [attributeName, attribute] of primitive.computedAttributes) {
          vertexAttributes.set(attributeName, new GLVertexAttribute({
            gl: this.gl,
            ...attribute,
            buffer: new GLBuffer({
              gl: this.gl,
              data: attribute.buffer,
            }),
          }));
        }

        if (!vertexAttributes.has('joint')) {
          vertexAttributes.set('joint', new GLVertexAttribute({
            gl: this.gl,
            componentType: this.gl.UNSIGNED_INT,
          }));
        }

        this._primitiveObjectMap.set(primitive, new GLObject({
          gl: this.gl,
          mesh: new GLMesh({
            gl: this.gl,
            attributes: vertexAttributes,
            indices: primitive.indices ? new GLVertexAttribute({
              gl: this.gl,
              ...primitive.indices,
              buffer: new GLBuffer({
                gl: this.gl,
                data: primitive.indices.buffer,
                target: this.gl.ELEMENT_ARRAY_BUFFER,
              }),
            }) : null,
          }),
          program: defaultProgram,
        }));
      }
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
      this._skinTextureMap.get(skin).data = skin.jointMatricesTextureData;
    }

    for (const node of scene.flattenedNodesWithMesh) {
      for (const primitive of node.mesh.primitives) {
        const object = this._primitiveObjectMap.get(primitive);
        object.draw({
          bind: true,
          uniforms: {
            transform: node.worldTransform,
            normalMatrix: node.normalMatrix,
            ...(node.weights ? { morphTargetWeights: node.weights } : null),
            ...(node.skin ? {
              skinned: true,
              jointMatricesTexture: this._skinTextureMap.get(node.skin),
              jointMatricesTextureSize: node.skin.jointMatricesTextureSize,
            } : null),
            ...uniforms,
          },
        });
      }
    }
  }
}
