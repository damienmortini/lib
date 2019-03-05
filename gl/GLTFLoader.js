import SingletonLoader, { Loader } from "../util/Loader.js";
import Base64 from "../math/Base64.js";

export class GLTFLoader extends Loader {
  constructor() {
    super();
    this.typeMap.get("json").add("gltf");
  }

  _loadFile(src, options = {}) {
    return super._loadFile(src, options).then((response) => {
      const rawData = response;

      const buffersPromises = [];
      for (const buffer of response.buffers) {
        if (buffer.uri.startsWith("data")) {
          buffersPromises.push(new Promise((resolve) => {
            resolve(Base64.toByteArray(buffer.uri.split(",")[1]).buffer);
          }));
        } else {
          buffersPromises.push(SingletonLoader.load(`${/([\\/]?.*[\\/])/.exec(src)[1]}${buffer.uri}`));
        }
      }

      return Promise.all(buffersPromises).then((buffers) => {
        const data = JSON.parse(JSON.stringify(rawData));
        data.raw = rawData;

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
            for (const key in primitive.attributes) {
              primitive.attributes[key] = data.accessors[primitive.attributes[key]];
            }
            primitive.indices = data.accessors[primitive.indices];
          }
        }

        return data;
      });
    });
  }
}

export default new GLTFLoader();
