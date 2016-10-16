import {
  TextureLoader,
  Texture,
  ObjectLoader,
  Mesh,
} from "three";

import "three/examples/js/loaders/ColladaLoader.js";
import "three/examples/js/loaders/OBJLoader.js";

import Loader from "../utils/Loader.js";

let PROMISES = Loader.promises;

function fixLoaderData(data, {scale}) {
  if(data instanceof Texture) {
    return;
  }

  let isCollada = !!data.dae;

  let meshes = [];

  if(isCollada) {
    data = data.scene;
  }

  data.traverse((object3D) => {
    if(object3D instanceof Mesh) {
      meshes.push(object3D);
    }
    object3D.position.multiplyScalar(scale);
  });

  for (let mesh of meshes) {
    mesh.geometry.scale(scale, scale, scale);

    if(isCollada) {
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

export default class THREELoader {
  static get onLoad() {
    return Loader.onLoad;
  }

  static load(value, {scale = 1} = {}) {
    let loader;
    let texture;

    if(/\.(png|jpg)$/.test(value)) {
      loader = new TextureLoader();
    }
    else if(/\.(dae)$/.test(value)) {
      loader = new THREE.ColladaLoader();
      loader.options.convertUpAxis = true;
    }
    else if(/\.(obj)$/.test(value)) {
      loader = new THREE.OBJLoader();
    }
    else if(/\.(json)$/.test(value)) {
      loader = new ObjectLoader();
    }

    let promise = new Promise((resolve) => {
      texture = loader.load(value, (data) => {
        fixLoaderData(data, {scale});
        PROMISES.delete(value);
        resolve(data);
      });
    });

    PROMISES.set(value, promise);

    return loader instanceof TextureLoader ? texture : promise;
  }
}
