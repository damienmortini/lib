import Loader from"dlib/utils/Loader.js";

export default class GLTFLoader extends Loader {
  static load(value) {
    GLTFLoader.typeMap.get("json").push("gltf");

    let path = /([\\/]?.*[\\/])/.exec(value)[1];
    let buffers = new Map();
    let meshes = new Map();
    let gltfData;
    
    return Loader.load(value)
    .then((data) => {
      gltfData = data;
      let bufferURLs = [];
      for(let key in gltfData.buffers) {
        buffers.set(key, null);
        bufferURLs.push(`${path}/${gltfData.buffers[key].uri}`);
      }

      return Loader.load(bufferURLs);
    })
    .then((data) => {
      let i = 0;
      for (let key of buffers.keys()) {
        buffers.set(key, data[i]);
        i++;
      }
      
      for (let key in gltfData.meshes) {
        let mesh = {
          primitives: []
        };
        for (let primitive of primitives) {
          mesh
        }
        console.log(mesh);
      }

      console.log(gltfData);
      return {
        data: gltfData,
        buffers
      }
    });
  }
}