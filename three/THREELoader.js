import {
  TextureLoader,
  ObjectLoader,
} from "three";

import "three/examples/js/loaders/ColladaLoader.js";

import Loader from "../utils/Loader.js";

let PROMISES = Loader.promises;

export default class THREELoader {
  static load(value) {
    let loader;

    if(/\.(png|jpg)$/.test(value)) {
      loader = new TextureLoader();
    }
    else if(/\.(dae)$/.test(value)) {
      loader = new THREE.ColladaLoader();
    }
    else if(/\.(json)$/.test(value)) {
      loader = new ObjectLoader();
    }

    let promise = new Promise((resolve) => {
      value = loader.load(value, (data) => {
        PROMISES.delete(promise);
        resolve(data);
      });
    });

    PROMISES.add(promise);

    return loader instanceof TextureLoader ? value : promise;
  }
}
