import "../../three/examples/js/loaders/GLTFLoader.js";
import { Loader } from "../utils/Loader.js";

function scaleScene(data, scale) {
  if (scale === 1) {
    return;
  }
  data.traverse((object3D) => {
    if (object3D instanceof THREE.Mesh || object3D instanceof THREE.Line || object3D instanceof THREE.LineSegments) {
      object3D.geometry.scale(scale, scale, scale);
    }
    object3D.position.multiplyScalar(scale);
    object3D.matrixAutoUpdate = true;
  });
}

class THREELoader extends Loader {
  _loadFile(src, { scale = 1 } = {}) {
    return new Promise((resolve) => {
      if (/\.(gltf|glb)$/.test(src)) {
        const loader = new THREE.GLTFLoader();
        loader.setPath(/(.*[\/\\]).*$/.exec(src)[1]);
        loader.load(src, (data) => {
          scaleScene(data.scene, scale);
          resolve(data);
        });
      } else if (/\.(png|jpg|mp4)$/.test(src)) {
        new THREE.TextureLoader().load(src, (data) => {
          resolve(data);
        });
      }
    });
  }
}

export default new THREELoader();