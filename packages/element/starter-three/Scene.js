import { Scene as THREEScene } from '../../three/src/scenes/Scene.js'
import { PerspectiveCamera } from '../../three/src/cameras/PerspectiveCamera.js'
import { Mesh } from '../../three/src/objects/Mesh.js'
import { BoxGeometry } from '../../three/src/geometries/BoxGeometry.js'
import { MeshNormalMaterial } from '../../three/src/materials/MeshNormalMaterial.js'

import TrackballController from '../../@damienmortini/core/3d/controller/TrackballController.js'

export default class Scene extends THREEScene {
  constructor({ canvas }) {
    super()

    this.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000)

    this.controls = new TrackballController({
      distance: 5,
      domElement: canvas,
    })
    this.camera.matrixAutoUpdate = false

    const cube = new Mesh(new BoxGeometry(1, 1, 1), new MeshNormalMaterial())
    this.add(cube)
  }

  resize(width, height) {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  update() {
    this.controls.update()
    this.camera.matrix.fromArray(this.controls.matrix)
    this.camera.matrixWorldNeedsUpdate = true
  }
}
