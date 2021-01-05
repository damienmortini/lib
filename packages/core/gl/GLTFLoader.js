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

    const rawData = JSON.parse(JSON.stringify(data));
    data.raw = rawData;

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

  build({ gl, data }) {
    const finalData = {};

    // Meshes
    const meshesMap = new Map();
    finalData.meshes = [];
    for (const meshData of data.meshes) {
      const mesh = new GLTFMesh({ gl, data: meshData });
      finalData.meshes.push(mesh);
      meshesMap.set(meshData, mesh);
    }

    // Nodes
    const nodesMap = new Map();
    finalData.nodes = [];
    for (const nodeData of data.nodes) {
      const node = new GLTFNode({ gl, data: { ...nodeData, mesh: meshesMap.get(nodeData.mesh) } });
      finalData.nodes.push(node);
      nodesMap.set(nodeData, node);
    }

    // Animations
    const animationsMap = new Map();
    finalData.animations = [];
    for (const rawAnimationData of data.animations) {
      const animationData = { ...rawAnimationData };
      animationData.channels = [...animationData.channels];
      for (let index = 0; index < animationData.channels.length; index++) {
        const channel = { ...animationData.channels[index] };
        channel.target = { ...channel.target, node: nodesMap.get(channel.target.node) };
        animationData.channels[index] = channel;
      }
      const animation = new GLTFAnimation({ data: animationData });
      animationsMap.set(rawAnimationData, animation);
      finalData.animations.push(animation);
    }

    // Scenes
    const scenesMap = new Map();
    finalData.scenes = [];
    for (const rawSceneData of data.scenes) {
      const sceneData = { ...rawSceneData };
      sceneData.nodes = [...sceneData.nodes];
      for (let index = 0; index < sceneData.nodes.length; index++) {
        sceneData.nodes[index] = nodesMap.get(sceneData.nodes[index]);
      }
      const scene = new GLTFScene({ data: sceneData });
      scenesMap.set(rawSceneData, scene);
      finalData.scenes.push(scene);
    }

    finalData.scene = scenesMap.get(data.scene);

    return finalData;
  }

  async _loadFile(options) {
    let data = await super._loadFile(options);
    data = await this.parse(data);
    if (options.gl) {
      data = this.build({ gl: options.gl, data });
    }
    return data;
  }
}

export default new GLTFLoader();
