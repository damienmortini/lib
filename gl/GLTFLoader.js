import Loader from"dlib/utils/Loader.js";

export default class GLTFLoader extends Loader {
  static load(value) {
    let path = /([\\/]?.*[\\/])/.exec(value)[1];
    let objectMap = new Map();
    let rawData;

    GLTFLoader.typeMap.get("json").push("gltf");
    
    return Loader.load(value)
    .then((data) => {
      rawData = data;
      let bufferURLs = [];
      for(let key in rawData.buffers) {
        objectMap.set(key, null);
        bufferURLs.push(`${path}${rawData.buffers[key].uri}`);
      }

      return Loader.load(bufferURLs);
    })
    .then((buffersData) => {
      let i = 0;
      for (let key of objectMap.keys()) {
        objectMap.set(key, buffersData[i]);
        i++;
      }

      let data = JSON.parse(JSON.stringify(rawData));
      data.raw = rawData;

      let typeKeys = [
        "accessors",
        "bufferViews",
        "meshes",
        "materials", 
        "cameras",
        "nodes",
        "scenes"
      ];

      for (let typeKey in data) {
        if(!typeKeys.includes(typeKey)) {
          continue;
        }
        for(let objectKey in data[typeKey]) {
          objectMap.set(objectKey, data[typeKey][objectKey]);
        }
      }

      function traverse(object) {
        for (let key in object) {
          if(typeof object[key] === "string") {
            let data = objectMap.get(object[key]);
            if(data) {
              object[key] = data;
            }
          } else if(object[key] && typeof object[key] === "object") {
            traverse(object[key]);
          }
        }
      }

      traverse(data);

      return data;
    });
  }
}