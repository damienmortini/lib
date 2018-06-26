import SingletonLoader, { Loader } from "../utils/Loader.js";

export class GLTFLoader extends Loader {
  constructor() {
    super();
    this.typeMap.get("json").add("gltf");
  }

  _loadFile(src, options = {}) {
    return super._loadFile(src, options).then((response) => {
      const rawData = response;

      return SingletonLoader.load(response.buffers.map((value) => `${/([\\/]?.*[\\/])/.exec(src)[1]}${value.uri}`))
        .then((buffers) => {
          const data = JSON.parse(JSON.stringify(rawData));
          data.raw = rawData;

          for (let node of data.nodes) {
            node.mesh = data.meshes[node.mesh];
          }

          for (let bufferView of data.bufferViews) {
            bufferView.buffer = buffers[bufferView.buffer];
          }

          for (let accessor of data.accessors) {
            accessor.bufferView = data.bufferViews[accessor.bufferView];
          }

          for (let mesh of data.meshes) {
            for (let primitive of mesh.primitives) {
              for (let key in primitive.attributes) {
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
