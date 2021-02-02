import SingletonLoader, { Loader } from '../util/Loader.js';
import Base64 from '../math/Base64.js';
import GLTFMesh from './GLTFMesh.js';
import GLTFNode from './GLTFNode.js';
import GLTFAnimation from './GLTFAnimation.js';
import GLTFScene from './GLTFScene.js';
import GLTFSkin from './GLTFSkin.js';
import GLTFAccessor from './GLTFAccessor.js';
import GLTFMaterial from './GLTFMaterial.js';

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

    for (const [index, buffer] of data.raw.buffers.entries()) {
      if (buffer.binary) {
        data.buffers[index] = buffer.binary;
      } else if (buffer.uri.startsWith('data')) {
        data.buffers[index] = Base64.toByteArray(buffer.uri.split(',')[1]).buffer;
      } else {
        data.buffers[index] = await SingletonLoader.load(`${/([\\/]?.*[\\/])/.exec(src)[1]}${buffer.uri}`);
      }
    }

    for (const bufferView of data.bufferViews) {
      bufferView.buffer = data.buffers[bufferView.buffer];
    }

    for (const accessor of data.accessors) {
      accessor.bufferView = data.bufferViews[accessor.bufferView];
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

    for (const skin of data.skins ?? []) {
      skin.inverseBindMatrices = data.accessors[skin.inverseBindMatrices];
      for (let index = 0; index < skin.joints.length; index++) {
        skin.joints[index] = data.nodes[skin.joints[index]];
      }
    }

    for (const mesh of data.meshes) {
      for (const primitive of mesh.primitives) {
        for (const key of Object.keys(primitive.attributes)) {
          primitive.attributes[key] = data.accessors[primitive.attributes[key]];
        }
        if (primitive.targets) {
          for (const target of primitive.targets) {
            if (target.POSITION !== undefined) target.POSITION = data.accessors[target.POSITION];
            if (target.NORMAL !== undefined) target.NORMAL = data.accessors[target.NORMAL];
            if (target.TANGENT !== undefined) target.TANGENT = data.accessors[target.TANGENT];
          }
        }
        primitive.indices = data.accessors[primitive.indices];
        if (primitive.material !== undefined) primitive.material = data.materials[primitive.material];
      }
    }

    for (const animation of data.animations ?? []) {
      for (const sampler of animation.samplers) {
        for (const type of ['input', 'output']) {
          sampler[type] = data.accessors[sampler[type]];
        }
      }
      for (const channel of animation.channels) {
        channel.sampler = animation.samplers[channel.sampler];
        channel.target.node = data.nodes[channel.target.node];
      }
    }

    return data;
  }

  async build({ data }) {
    data = await this.parse(data);

    // Accessors
    const accessorsDataMap = new Map();
    for (let index = 0; index < data.accessors.length; index++) {
      const accessorData = data.accessors[index];
      const accessor = new GLTFAccessor({ data: accessorData });
      data.accessors[index] = accessor;
      accessorsDataMap.set(accessorData, accessor);
    }

    // Materials
    if (data.materials) {
      for (let index = 0; index < data.materials.length; index++) {
        const material = new GLTFMaterial({ data: data.materials[index] });
        data.materials[index] = material;
      }
    }

    // Meshes
    for (let index = 0; index < data.meshes.length; index++) {
      const meshData = data.meshes[index];
      const meshRawData = data.raw.meshes[index];
      for (let index = 0; index < meshData.primitives.length; index++) {
        const primitiveData = meshData.primitives[index];
        const primitiveRawData = meshRawData.primitives[index];
        for (const [key, accessorData] of Object.entries(primitiveData.attributes)) {
          primitiveData.attributes[key] = accessorsDataMap.get(accessorData);
        }
        if (primitiveData.targets) {
          for (const target of primitiveData.targets) {
            if (target.POSITION) target.POSITION = accessorsDataMap.get(target.POSITION);
            if (target.NORMAL) target.NORMAL = accessorsDataMap.get(target.NORMAL);
            if (target.TANGENT) target.TANGENT = accessorsDataMap.get(target.TANGENT);
          }
        }
        primitiveData.indices = accessorsDataMap.get(primitiveData.indices);
        if (primitiveData.material !== undefined) primitiveData.material = data.materials[primitiveRawData.material];
      }
      const mesh = new GLTFMesh({ data: meshData });
      data.meshes[index] = mesh;
    }

    // Nodes
    for (let index = 0; index < data.nodes.length; index++) {
      const nodeData = data.nodes[index];
      nodeData.mesh = data.meshes[data.raw.nodes[index].mesh];
      const node = new GLTFNode({ data: nodeData });
      data.nodes[index] = node;
    }
    for (let index = 0; index < data.nodes.length; index++) {
      const nodeRawData = data.raw.nodes[index];
      if (nodeRawData.children) {
        const node = data.nodes[index];
        for (let index = 0; index < node.children.length; index++) {
          node.children[index] = data.nodes[nodeRawData.children[index]];
        }
      }
    }

    // Skins
    if (data.skins) {
      for (let index = 0; index < data.skins.length; index++) {
        const skinData = data.skins[index];
        const skinRawData = data.raw.skins[index];
        for (let index = 0; index < skinData.joints.length; index++) {
          skinData.joints[index] = data.nodes[skinRawData.joints[index]];
        }
        const skin = new GLTFSkin({ data: skinData });
        data.skins[index] = skin;
      }
      for (let index = 0; index < data.nodes.length; index++) {
        if (data.raw.nodes[index].skin !== undefined) {
          data.nodes[index].skin = data.skins[data.raw.nodes[index].skin];
        }
      }
    }

    // Animations
    if (data.animations) {
      for (let index = 0; index < data.animations.length; index++) {
        const animationData = data.animations[index];
        const animationRawData = data.raw.animations[index];
        for (let index = 0; index < animationData.channels.length; index++) {
          animationData.channels[index].target.node = data.nodes[animationRawData.channels[index].target.node];
        }
        for (const sampler of animationData.samplers) {
          for (const type of ['input', 'output']) {
            sampler[type] = accessorsDataMap.get(sampler[type]).typedArray;
          }
        }
        const animation = new GLTFAnimation({ data: animationData });
        data.animations[index] = animation;
      }
    }

    // Scenes
    for (let index = 0; index < data.scenes.length; index++) {
      const sceneData = data.scenes[index];
      const sceneRawData = data.raw.scenes[index];
      for (let index = 0; index < sceneData.nodes.length; index++) {
        sceneData.nodes[index] = data.nodes[sceneRawData.nodes[index]];
      }
      const scene = new GLTFScene({ data: sceneData });
      data.scenes[index] = scene;
    }

    data.scene = data.scenes[data.raw.scene];

    return data;
  }

  async _loadFile(options) {
    const data = await super._loadFile(options);
    return options.parseOnly ? await this.parse(data) : await this.build({ data });
  }
}

export default new GLTFLoader();
