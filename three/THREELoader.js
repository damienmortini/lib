import THREE from "three";

import Loader from "../utils/Loader.js";

let PROMISES = Loader.promises;

export default class THREELoader {
  static load(value) {
    let loader;

    if(/\.(png|jpg)$/.test(value)) {
      loader = new THREE.TextureLoader();
    }
    else if(/\.(json)$/.test(value)) {
      loader = new THREE.ObjectLoader();
    }

    let value;

    let promise = new Promise((resolve) => {
      value = loader.load(value, (data) => {
        PROMISES.delete(promise);
        resolve(data);
      });
    });

    PROMISES.add(promise);

    return loader instanceof THREE.TextureLoader ? value : promise;
  }
}
