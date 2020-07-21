import { Loader } from '../../core/util/Loader.js';
import { WebGLRenderer } from '../../../three/src/renderers/WebGLRenderer.js';
import { TextureLoader } from '../../../three/src/loaders/TextureLoader.js';

import { BasisTextureLoader } from './_BasisTextureLoader.js';
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

let gltfLoader;
let dracoLoader;
let basisLoader;

class THREELoader extends Loader {
  constructor() {
    super();
    this.dracoDecoderPath = 'node_modules/three/examples/js/libs/draco/';
    this.basisTranscoderPath = 'node_modules/three/examples/js/libs/basis/';

    this.extensionTypeMap.set('gltf', 'model/gltf+json');
    this.extensionTypeMap.set('glb', 'model/gltf-binary');
    this.extensionTypeMap.set('basis', 'image/basis');
  }

  _loadFile({ src, type, scale = 1, offset = new Vector3() }) {
    if (type.startsWith('model')) {
      const [, path, file] = /(.*[\/\\])(.*$)/.exec(src);

      if (!gltfLoader) {
        gltfLoader = new GLTFLoader(undefined);
        dracoLoader = new DRACOLoader(undefined);
        dracoLoader.setWorkerLimit(2);
        gltfLoader.setDRACOLoader(dracoLoader);
      }

      dracoLoader.setDecoderPath(`${this.baseURI}${this.dracoDecoderPath}`);
      gltfLoader.setPath(path);

      return new Promise((resolve) => {
        gltfLoader.load(file, (data) => {
          computeSceneGeometry(data.scene, scale, offset);
          resolve(data);
        });
      });
    } else if (type === 'image/basis') {
      if (!basisLoader) {
        basisLoader = new BasisTextureLoader(undefined);
        basisLoader.setWorkerLimit(2);
        let renderer;
        if (window.WebGL2RenderingContext !== undefined && !/\bforcewebgl1\b/.test(window.location.search)) {
          const canvas = document.createElement('canvas');
          renderer = new WebGLRenderer({
            canvas: canvas,
            context: canvas.getContext('webgl2'),
          });
        } else {
          renderer = new WebGLRenderer();
        }
        basisLoader.detectSupport(renderer);
      }
      basisLoader.setTranscoderPath(`${this.baseURI}${this.basisTranscoderPath}`);
      return new Promise((resolve) => {
        basisLoader.load(src, (texture) => {
          resolve(texture);
        });
      });
    } else if (type.startsWith('image') || type.startsWith('video')) {
      return new Promise((resolve) => {
        new TextureLoader().load(src, (texture) => {
          resolve(texture);
        });
      });
    } else {
      return super._loadFile({ src, type });
    }
  }
}

export default new THREELoader();
