import GLTFShader from '../../shader/GLTFShader.js';
import GLBuffer from '../GLBuffer.js';
import GLGeometry from '../GLGeometry.js';
import GLObject from '../GLObject.js';
import GLProgram from '../GLProgram.js';
import GLTexture from '../GLTexture.js';
import GLTFLoader from '../GLTFLoader.js';
import GLTFNode from '../GLTFNode.js';
import GLVertexAttribute from '../GLVertexAttribute.js';

export default class GLGLTFObject extends GLTFNode {
  constructor({
    gl,
    src,
    program = null,
  }) {
    super();

    this._gltf = null;
    this._currentTime = 0;
    this._duration = 0;
    this._skinTextureMap = new Map();
    this._materialProgramMap = new Map();
    this._primitiveObjectMap = new Map();

    this.gl = gl;
    this.program = program;

    this.meshes = new Map();
    this.programs = new Map();
    this.animations = new Map();

    this.ready = this._load(src);
  }

  async _load(src) {
    this._gltf = await GLTFLoader.load({
      src,
    });

    const bufferViewBufferMap = new Map();
    for (const bufferView of this._gltf.bufferViews) {
      bufferViewBufferMap.set(bufferView, new GLBuffer({
        gl: this.gl,
        data: bufferView.buffer,
        target: bufferView.target,
      }));
    }

    for (const [index, animation] of this._gltf.animations?.entries() ?? []) {
      this._duration = Math.max(this._duration, animation.duration);
      this.animations.set(animation.name ?? index, animation);
    }

    for (const skin of this._gltf.skins ?? []) {
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

    if (!this.program) {
      for (const [index, material] of this._gltf.materials?.entries() ?? []) {
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
        this.programs.set(material.name ?? index, program);
      }
    }

    for (const [index, mesh] of this._gltf.meshes?.entries()) {
      const meshObject = { name: mesh.name, primitives: [] };
      for (const primitive of mesh.primitives) {
        const vertexAttributes = new Map();
        for (const [attributeName, attribute] of primitive.attributes) {
          vertexAttributes.set(attributeName, new GLVertexAttribute({
            gl: this.gl,
            ...attribute,
            data: bufferViewBufferMap.get(attribute.bufferView),
          }));
        }

        if (!vertexAttributes.has('joint')) {
          const count = primitive.attributes.get('position').count;
          vertexAttributes.set('joint', new GLVertexAttribute({
            gl: this.gl,
            componentType: this.gl.UNSIGNED_INT,
            data: new Uint8Array(count * 4),
          }));
        }

        const object = new GLObject({
          gl: this.gl,
          geometry: new GLGeometry({
            gl: this.gl,
            attributes: vertexAttributes,
            indices: primitive.indices ? new GLVertexAttribute({
              gl: this.gl,
              ...primitive.indices,
              data: bufferViewBufferMap.get(primitive.indices.bufferView),
              target: this.gl.ELEMENT_ARRAY_BUFFER,
            }) : null,
          }),
          program: this.program,
        });

        this._primitiveObjectMap.set(primitive, object);
        meshObject.primitives.push(object);
      }
      this.meshes.set(mesh.name ?? index, meshObject);
    }

    this._scene = this._gltf.scene ?? this._gltf.scenes[0];

    this.children = this._scene.nodes;
    this._scene.nodes = [this];
  }

  get duration() {
    return this._duration;
  }

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(value) {
    this._currentTime = value;
    for (const animation of this._gltf?.animations ?? []) {
      animation.currentTime = this._currentTime;
    }
  }

  get program() {
    return this._program;
  }

  set program(value) {
    this._program = value;
    for (const object of this._primitiveObjectMap.values()) {
      object.program = this._program;
    }
  }

  get flattenedChildren() {
    return this._scene.flattenedNodes;
  }

  get flattenedChildrenWithMesh() {
    return this._scene.flattenedNodesWithMesh;
  }

  updateAndDraw({ uniforms }) {
    this.update();
    this.draw({ uniforms });
  }

  update() {
    if (!this._gltf) {
      return;
    }

    this._scene.updateWorldTransforms();

    for (const skin of this._gltf.skins ?? []) {
      skin.updateJointsTextureData();
      this._skinTextureMap.get(skin).data = skin.jointMatricesTextureData;
    }
  }

  draw({ uniforms }) {
    if (!this._gltf) {
      return;
    }

    for (const node of this._scene.flattenedNodesWithMesh) {
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
