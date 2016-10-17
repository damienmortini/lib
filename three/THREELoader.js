import {
  Texture,
  RGBFormat,
  ObjectLoader,
  Mesh,
} from "three";

import "three/examples/js/loaders/ColladaLoader.js";
import "three/examples/js/loaders/OBJLoader.js";

import Loader from "../utils/Loader.js";

function fixLoaderData(data, {scale}) {
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

export default class THREELoader extends Loader {
  static load(value, {scale = 1} = {}) {
    let texture;

    if(/\.(png|jpg)$/.test(value)) {
      texture = new Texture();
      if(/\.(jpg)$/.test(value)) {
        texture.format = RGBFormat;
      }
    }

    let promise = super.load(value).then((data) => {
      if(texture) {
        texture.image = data;
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
      else if(/\.(json)$/.test(value)) {
        let object = new ObjectLoader().parse(data);
        fixLoaderData(object, {scale});
        return object;
      }
    });

    return texture || promise;
  }
}
