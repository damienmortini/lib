import SingletonLoader, { Loader } from '../util/Loader.js';
import Base64 from '../math/Base64.js';

export class GLTFLoader extends Loader {
  constructor() {
    super();

    this.extensionTypeMap.set('gltf', 'application/json');
    this.extensionTypeMap.set('glb', 'application/octet-stream');
  }

  async parse(data) {
    const rawData = JSON.parse(JSON.stringify(data));
    data.raw = rawData;

    const buffers = [];
    for (const buffer of data.buffers) {
      if (buffer.uri.startsWith('data')) {
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
