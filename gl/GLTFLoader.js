import Loader from"dlib/utils/Loader.js";

export default class GLTFLoader extends Loader {
  static load(value) {
    GLTFLoader.typeMap.get("json").push("gltf");

    let path = /([\\/]?.*[\\/])/.exec(value)[1];
    let buffers = new Map();
    let meshes = new Map();
    let rawData;
    
    return Loader.load(value)
    .then((data) => {
      rawData = data;
      let bufferURLs = [];
      for(let key in rawData.buffers) {
        buffers.set(key, null);
        bufferURLs.push(`${path}/${rawData.buffers[key].uri}`);
      }

      return Loader.load(bufferURLs);
    })
    .then((buffersData) => {
      let i = 0;
      for (let key of buffers.keys()) {
        buffers.set(key, buffersData[i]);
        i++;
      }

      let data = JSON.parse(JSON.stringify(rawData));
      data.raw = rawData;

      for (let key in data.bufferViews) {
        data.bufferViews[key].buffer = buffers.get(data.bufferViews[key].buffer);
      }

      for (let key in data.accessors) {
        data.accessors[key].bufferView = data.bufferViews[data.accessors[key].bufferView];
      }

      for (let key in data.meshes) {
        let mesh = data.meshes[key];
        for (let primitive of mesh.primitives) {
          primitive.indices = data.accessors[primitive.indices];
          for (let key in primitive.attributes) {
            primitive.attributes[key] = data.accessors[primitive.attributes[key]];
          }
        }
      }

      return data;
    });
  }
}