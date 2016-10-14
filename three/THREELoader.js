import {
  TextureLoader,
  ObjectLoader,
  Mesh,
} from "three";

import "three/examples/js/loaders/ColladaLoader.js";
import "three/examples/js/loaders/OBJLoader.js";

import Loader from "../utils/Loader.js";

let PROMISES = Loader.promises;

function fixColladaLoaderData(data, {scale}) {
  let meshContainers = [];
  data.scene.traverse((object3D) => {
    if(object3D.children[0] instanceof Mesh) {
      meshContainers.push(object3D);
    }
    [object3D.position.y, object3D.position.z] = [object3D.position.z, -object3D.position.y];
    object3D.position.multiplyScalar(scale);
    [object3D.rotation.y, object3D.rotation.z] = [object3D.rotation.z, -object3D.rotation.y];
    [object3D.scale.y, object3D.scale.z] = [object3D.scale.z, object3D.scale.y];
  });
  for (let object3D of meshContainers) {
    let mesh = object3D.children[0];
    object3D.remove(mesh);
    mesh.name = object3D.name;
    mesh.position.copy(object3D.position);
    mesh.rotation.copy(object3D.rotation);
    mesh.scale.copy(object3D.scale);
    mesh.geometry.rotateX(-Math.PI * .5);
    mesh.geometry.scale(scale, scale, scale);
    object3D.parent.add(mesh);
    object3D.parent.remove(object3D);
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
    }
    else if(/\.(obj)$/.test(value)) {
      loader = new THREE.OBJLoader();
    }
    else if(/\.(json)$/.test(value)) {
      loader = new ObjectLoader();
    }

    let promise = new Promise((resolve) => {
      texture = loader.load(value, (data) => {
        PROMISES.delete(value);
        if(/\.(dae)$/.test(value)) {
          fixColladaLoaderData(data, {scale});
        }
        resolve(data);
      });
    });

    PROMISES.set(value, promise);

    return loader instanceof TextureLoader ? texture : promise;
  }
}
