import Loader from"dlib/utils/Loader.js";

export default class GLTFLoader extends Loader {
  static load(value) {
    let path = /([\\/]?.*[\\/])/.exec(value)[1];
    let objectMap = new Map();
    let rawData;

    GLTFLoader.typeMap.get("json").add("gltf");
    
    let promise = Loader.load(value)
    .then((data) => {
      rawData = data;
      return Loader.load(rawData.buffers.map(value => `${path}${value.uri}`));
    })
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

    Loader.promises.set(value, promise);

    return promise;
  }
}