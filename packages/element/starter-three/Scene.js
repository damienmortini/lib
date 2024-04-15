import TrackballController from '@damienmortini/core/input/TrackballController.js';

import { BoxGeometry, Mesh, MeshNormalMaterial, PerspectiveCamera, Scene as THREEScene } from '../../three/src/Three.js';

export default class Scene extends THREEScene {
  constructor({ canvas }) {
    super();

    this.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);

    this.controls = new TrackballController({
      distance: 5,
      domElement: canvas,
    });
    this.camera.matrixAutoUpdate = false;

    const cube = new Mesh(new BoxGeometry(1, 1, 1), new MeshNormalMaterial());
    this.add(cube);
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update() {
    this.controls.update();
    this.camera.matrix.fromArray(this.controls.matrix);
    this.camera.matrixWorldNeedsUpdate = true;
  }
}
