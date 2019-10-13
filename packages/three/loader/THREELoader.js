import { Loader } from "../../lib/util/Loader.js";
import { TextureLoader } from "../../../three/src/loaders/TextureLoader.js";

import { DRACOLoader } from "./_DRACOLoader.js";
import { GLTFLoader } from "./_GLTFLoader.js";
import { Mesh } from "../../../three/src/objects/Mesh.js";
import { Line } from "../../../three/src/objects/Line.js";
import { LineSegments } from "../../../three/src/objects/LineSegments.js";
import { Vector3 } from "../../../three/src/math/Vector3.js";

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

const loader = new GLTFLoader();
loader.setDRACOLoader(new DRACOLoader(undefined));

class THREELoader extends Loader {
  constructor() {
    super();
    this.dracoDecoderPath = "";

    this.extensionTypeMap.set("gltf", "model/gltf+json");
    this.extensionTypeMap.set("glb", "model/gltf-binary");
    this.extensionTypeMap.set("png", "application/texture");
    this.extensionTypeMap.set("jpg", "application/texture");
    this.extensionTypeMap.set("mp4", "application/texture");
  }

  _loadFile({ src, type, scale = 1, offset = new Vector3() }) {
    if (type.startsWith("model")) {
      DRACOLoader.setDecoderPath(`${this.baseURI.startsWith("/") ? "/" : ""}${this.dracoDecoderPath ? `${this.baseURI}${this.dracoDecoderPath}` : "node_modules/three/examples/js/libs/draco/gltf/"}`);

      const [, path, file] = /(.*[\/\\])(.*$)/.exec(src);

      loader.setPath(path);

      return new Promise((resolve) => {
        loader.load(file, (data) => {
          computeSceneGeometry(data.scene, scale, offset);
          resolve(data);
        });
      });
    } else if (type === "application/texture") {
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
