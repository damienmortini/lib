import {
  Texture,
  RGBFormat,
  ObjectLoader,
  Mesh,
  Line,
  LineSegments,
} from "three";

import "three/examples/js/loaders/ColladaLoader.js";
import "three/examples/js/loaders/OBJLoader.js";
import "three/examples/js/loaders/GLTF2Loader.js";

import Loader from "../utils/Loader.js";

let CACHED_CANVAS = new Map();

function fixLoaderData(data, {scale}) {
  data = data.scene || data;

  let meshes = [];

  data.traverse((object3D) => {
    if(object3D instanceof Mesh || object3D instanceof Line || object3D instanceof LineSegments) {
      meshes.push(object3D);
    }
    object3D.position.multiplyScalar(scale);
    object3D.matrixAutoUpdate = true;
  });

  for (let mesh of meshes) {
    if(scale !== 1) {
      mesh.geometry.scale(scale, scale, scale);
    }

    if(mesh.parent.children.length === 1) {
      let object3D = mesh.parent;
      object3D.remove(mesh);
      mesh.name = object3D.name;
      mesh.position.copy(object3D.position);
      mesh.rotation.copy(object3D.rotation);
      mesh.scale.copy(object3D.scale);
      object3D.parent.add(mesh);
      object3D.parent.remove(object3D);
    }
  }
}

Loader.typeMap.get("binary").add("glb");

export default class THREELoader extends Loader {
  static load(value, {scale = 1} = {}) {
    let texture;

    if(/\.(png|jpg|mp4)$/.test(value)) {
      texture = new Texture();
      if(/\.(jpg|mp4)$/.test(value)) {
        texture.format = RGBFormat;
      }
    }

    let promise = super.load(value).then((data) => {
      if(/\.(png|jpg)$/.test(value)) {
        let canvas = CACHED_CANVAS.get(data);
        if(!canvas) {
          canvas = document.createElement("canvas");
          canvas.width = data.width * scale;
          canvas.height = data.height * scale;
          let context = canvas.getContext("2d");
          context.drawImage(data, 0, 0, canvas.width, canvas.height);
          CACHED_CANVAS.set(data, canvas);
        }
        texture.image = canvas;
        texture.needsUpdate = true;
      }
      else if(/\.(mp4)$/.test(value)) {
        texture.image = data;
        texture.image.loop = true;
        texture.image.play();
        texture.needsUpdate = true;
      }
      else if(/\.(dae)$/.test(value)) {
        let loader = new THREE.ColladaLoader();
        loader.options.convertUpAxis = true;
        let object = loader.parse(data);
        fixLoaderData(object, {scale});
        return object;
      }
      else if(/\.(obj)$/.test(value)) {
        let object = new THREE.OBJLoader().parse(data);
        fixLoaderData(object, {scale});
        return object;
      }
      else if(/\.(gltf|glb)$/.test(value)) {
        return new Promise((resolve) => {
          new THREE.GLTF2Loader().parse(data instanceof ArrayBuffer ? data : JSON.parse(data), (object) => {
            fixLoaderData(object, {scale});
            resolve(object);
          }, /(.*[\/\\]).*$/.exec(value)[1]);
        });
      }
      else if(/\.(json)$/.test(value)) {
        let object = new ObjectLoader().parse(data);
        fixLoaderData(object, {scale});
        return object;
      }
    });

    if(!texture) {
      super.promises.set(value, promise);
    }

    return texture || promise;
  }
}
