import SingletonLoader, { Loader } from '../util/Loader.js';
import Base64 from '../math/Base64.js';

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
      node.mesh = data.meshes[node.mesh];
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

    return data;
  }

  _loadFile(...options) {
    return super._loadFile(...options).then(this.parse);
  }
}

export default new GLTFLoader();
