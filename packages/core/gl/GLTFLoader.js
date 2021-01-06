import SingletonLoader, { Loader } from '../util/Loader.js';
import Base64 from '../math/Base64.js';
import GLTFMesh from './GLTFMesh.js';
import GLTFNode from './GLTFNode.js';
import GLTFAnimation from './GLTFAnimation.js';
import GLTFScene from './GLTFScene.js';

export class GLTFLoader extends Loader {
  constructor() {
    super();

    this.extensionTypeMap.set('gltf', 'application/json');
    this.extensionTypeMap.set('glb', 'application/octet-stream');
  }

  // From https://github.com/donmccurdy/glTF-Transform/blob/e4108cc/packages/core/src/io/io.ts#L32
  static unpackGLB(glb) {
    // Decode and verify GLB header.
    const header = new Uint32Array(glb, 0, 3);
    if (header[0] !== 0x46546c67) {
      throw new Error('Invalid glTF asset.');
    } else if (header[1] !== 2) {
      throw new Error(`Unsupported glTF binary version, "${header[1]}".`);
    }
    // Decode and verify chunk headers.
    const jsonChunkHeader = new Uint32Array(glb, 12, 2);
    const jsonByteOffset = 20;
    const jsonByteLength = jsonChunkHeader[0];
    if (jsonChunkHeader[1] !== 0x4e4f534a) {
      throw new Error('Unexpected GLB layout.');
    }

    // Decode JSON.
    const jsonText = new TextDecoder().decode(glb.slice(jsonByteOffset, jsonByteOffset + jsonByteLength));
    const json = JSON.parse(jsonText);
    // JSON only
    if (jsonByteOffset + jsonByteLength === glb.byteLength) return json;

    const binaryChunkHeader = new Uint32Array(glb, jsonByteOffset + jsonByteLength, 2);
    if (binaryChunkHeader[1] !== 0x004e4942) {
      throw new Error('Unexpected GLB layout.');
    }
    // Decode content.
    const binaryByteOffset = jsonByteOffset + jsonByteLength + 8;
    const binaryByteLength = binaryChunkHeader[0];
    const binary = glb.slice(binaryByteOffset, binaryByteOffset + binaryByteLength);
    // Attach binary to buffer
    json.buffers[0].binary = binary;
    return json;
  }

  async parse(data) {
    if (data instanceof ArrayBuffer) {
      data = GLTFLoader.unpackGLB(data);
    }

    data = { ...JSON.parse(JSON.stringify(data)), raw: data };

    for (let index = 0; index < data.buffers.length; index++) {
      data.buffers[index] = data.raw.buffers[index];
    }

    const buffers = [];
    for (const buffer of data.buffers) {
      if (buffer.binary) {
        buffers.push(buffer.binary);
      } else if (buffer.uri.startsWith('data')) {
        buffers.push(Base64.toByteArray(buffer.uri.split(',')[1]).buffer);
      } else {
        buffers.push(await SingletonLoader.load(`${/([\\/]?.*[\\/])/.exec(src)[1]}${buffer.uri}`));
      }
    }

    for (const node of data.nodes) {
      if (node.mesh !== undefined) node.mesh = data.meshes[node.mesh];
      if (node.skin !== undefined) node.skin = data.skins[node.skin];
      if (node.children) {
        for (let index = 0; index < node.children.length; index++) {
          node.children[index] = data.nodes[node.children[index]];
        }
      }
    }

    for (const scene of data.scenes) {
      for (let index = 0; index < scene.nodes.length; index++) {
        scene.nodes[index] = data.nodes[scene.nodes[index]];
      }
    }

    data.scene = data.scenes[data.scene];

    if (data.skins) {
      for (const skin of data.skins) {
        for (let index = 0; index < skin.joints.length; index++) {
          skin.joints[index] = data.nodes[skin.joints[index]];
        }
      }
    }

    for (const bufferView of data.bufferViews) {
      bufferView.buffer = buffers[bufferView.buffer];
    }

    for (const accessor of data.accessors) {
      accessor.bufferView = data.bufferViews[accessor.bufferView];
    }

    for (const mesh of data.meshes) {
      for (const primitive of mesh.primitives) {
        for (const key of Object.keys(primitive.attributes)) {
          primitive.attributes[key] = data.accessors[primitive.attributes[key]];
        }
        primitive.indices = data.accessors[primitive.indices];
      }
    }

    if (data.animations) {
      const animationData = new Map();
      for (const animation of data.animations) {
        for (const sampler of animation.samplers) {
          for (const type of ['input', 'output']) {
            if (!animationData.get(sampler[type])) {
              const bufferView = data.bufferViews[sampler[type]];
              animationData.set(sampler[type], new Float32Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength / Float32Array.BYTES_PER_ELEMENT));
            }
            sampler[type] = animationData.get(sampler[type]);
          }
        }
        for (const channel of animation.channels) {
          channel.sampler = animation.samplers[channel.sampler];
          channel.target.node = data.nodes[channel.target.node];
        }
      }
    }

    return data;
  }

  async build({ gl, data }) {
    data = await this.parse(data);

    // Meshes
    for (let index = 0; index < data.meshes.length; index++) {
      const meshData = data.meshes[index];
      const mesh = new GLTFMesh({ gl, data: meshData });
      data.meshes[index] = mesh;
    }

    // Nodes
    for (let index = 0; index < data.nodes.length; index++) {
      const nodeData = data.nodes[index];
      nodeData.mesh = data.meshes[data.raw.nodes[index].mesh];
      const node = new GLTFNode({ gl, data: nodeData });
      data.nodes[index] = node;
    }
    for (let index = 0; index < data.nodes.length; index++) {
      const rawNodeData = data.raw.nodes[index];
      if (rawNodeData.children) {
        const nodeData = data.nodes[index];
        for (let index = 0; index < nodeData.children.length; index++) {
          nodeData.children[index] = data.nodes[rawNodeData.children[index]];
        }
      }
    }

    // Animations
    for (let index = 0; index < data.animations.length; index++) {
      const animationData = data.animations[index];
      const rawAnimationData = data.raw.animations[index];
      for (let index = 0; index < animationData.channels.length; index++) {
        animationData.channels[index].target.node = data.nodes[rawAnimationData.channels[index].target.node];
      }
      const animation = new GLTFAnimation({ data: animationData });
      data.animations[index] = animation;
    }

    // Scenes
    for (let index = 0; index < data.scenes.length; index++) {
      const sceneData = data.scenes[index];
      const rawSceneData = data.raw.scenes[index];
      for (let index = 0; index < sceneData.nodes.length; index++) {
        sceneData.nodes[index] = data.nodes[rawSceneData.nodes[index]];
      }
      const scene = new GLTFScene({ data: sceneData });
      data.scenes[index] = scene;
    }

    data.scene = data.scenes[data.raw.scene];

    return data;
  }

  async _loadFile(options) {
    const data = await super._loadFile(options);
    return options.gl ? await this.build({ gl: options.gl, data }) : await this.parse(data);
  }
}

export default new GLTFLoader();
