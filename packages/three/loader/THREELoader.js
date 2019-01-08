import { Loader } from "../../dlib/utils/Loader.js";
import { TextureLoader } from "../../three/src/loaders/TextureLoader.js";

import _THREEGLTFLoader from "./_THREEGLTFLoader.js";
import _THREEDRACOLoader from "./_THREEDRACOLoader.js";

function scaleScene(data, scale) {
  if (scale === 1) {
    return;
  }
  data.traverse((object3D) => {
    if (object3D instanceof Mesh || object3D instanceof Line || object3D instanceof LineSegments) {
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
        const loader = new _THREEGLTFLoader();
        _THREEDRACOLoader.setDecoderPath("node_modules/three/examples/js/libs/draco/");
        loader.setDRACOLoader( new _THREEDRACOLoader() );

        const [, path, file] = /(.*[\/\\])(.*$)/.exec(src);

        loader.setPath(path);
        loader.load(file, (data) => {
          scaleScene(data.scene, scale);
          resolve(data);
        });
      } else if (/\.(png|jpg|mp4)$/.test(src)) {
        new TextureLoader().load(src, (data) => {
          resolve(data);
        });
      }
    });
  }
}

export default new THREELoader();
