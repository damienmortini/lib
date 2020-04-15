import { Loader } from '../../core/util/Loader.js';
import { TextureLoader } from '../../../three/src/loaders/TextureLoader.js';

import { DRACOLoader } from './_DRACOLoader.js';
import { GLTFLoader } from './_GLTFLoader.js';
import { Mesh } from '../../../three/src/objects/Mesh.js';
import { Line } from '../../../three/src/objects/Line.js';
import { LineSegments } from '../../../three/src/objects/LineSegments.js';
import { Vector3 } from '../../../three/src/math/Vector3.js';

function computeSceneGeometry(data, scale, offset) {
  const hasOffset = offset.lengthSq() !== 0;
  data.traverse((object3D) => {
    if (hasOffset) {
      if (object3D instanceof Mesh || object3D instanceof Line || object3D instanceof LineSegments) {
        object3D.geometry.translate(offset.x, offset.y, offset.z);
      }
    }
    if (scale !== 1) {
      if (object3D instanceof Mesh || object3D instanceof Line || object3D instanceof LineSegments) {
        object3D.geometry.scale(scale, scale, scale);
      }
      object3D.position.multiplyScalar(scale);
    }
  });
}

const dracoLoader = new DRACOLoader(undefined);
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

class THREELoader extends Loader {
  constructor() {
    super();
    this.dracoDecoderPath = 'node_modules/three/examples/js/libs/draco/';

    this.extensionTypeMap.set('gltf', 'model/gltf+json');
    this.extensionTypeMap.set('glb', 'model/gltf-binary');
    this.extensionTypeMap.set('png', 'application/texture');
    this.extensionTypeMap.set('jpg', 'application/texture');
    this.extensionTypeMap.set('mp4', 'application/texture');
  }

  _loadFile({ src, type, scale = 1, offset = new Vector3() }) {
    if (type.startsWith('model')) {
      dracoLoader.setDecoderPath(`${this.baseURI}${this.dracoDecoderPath}`);

      const [, path, file] = /(.*[\/\\])(.*$)/.exec(src);

      loader.setPath(path);

      return new Promise((resolve) => {
        loader.load(file, (data) => {
          computeSceneGeometry(data.scene, scale, offset);
          resolve(data);
        });
      });
    } else if (type === 'application/texture') {
      return new Promise((resolve) => {
        new TextureLoader().load(src, (data) => {
          resolve(data);
        });
      });
    } else {
      return super._loadFile({ src, type });
    }
  }
}

export default new THREELoader();
