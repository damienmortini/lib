import { Loader } from '@damienmortini/core/util/Loader.js'
import { BasisTextureLoader } from '../examples/loaders/BasisTextureLoader.js'
import { DRACOLoader } from '../examples/loaders/DRACOLoader.js'
import { GLTFLoader } from '../examples/loaders/GLTFLoader.js'
import { KTX2Loader } from '../examples/loaders/KTX2Loader.js'
import { Mesh, Line, LineSegments, Vector3, WebGLRenderer, TextureLoader } from '../../../three/src/Three.js'

let renderer
const getEmptyRenderer = () => {
  if (renderer) return renderer
  if (window.WebGL2RenderingContext !== undefined && !/\bforcewebgl1\b/.test(window.location.search)) {
    const canvas = document.createElement('canvas')
    renderer = new WebGLRenderer({
      canvas: canvas,
      context: canvas.getContext('webgl2'),
    })
  } else {
    renderer = new WebGLRenderer()
  }
  return renderer
}

function computeSceneGeometry(data, scale, offset) {
  const hasOffset = offset.lengthSq() !== 0
  data.traverse((object3D) => {
    if (hasOffset) {
      if (object3D instanceof Mesh || object3D instanceof Line || object3D instanceof LineSegments) {
        object3D.geometry.translate(offset.x, offset.y, offset.z)
      }
    }
    if (scale !== 1) {
      if (object3D instanceof Mesh || object3D instanceof Line || object3D instanceof LineSegments) {
        object3D.geometry.scale(scale, scale, scale)
      }
      object3D.position.multiplyScalar(scale)
    }
  })
}

let gltfLoader
let dracoLoader
let basisLoader
let ktx2Loader

let meshOptimizerInitialized = false

class THREELoader extends Loader {
  constructor() {
    super()
    this.dracoDecoderPath = 'node_modules/three/examples/js/libs/draco/'
    this.basisTranscoderPath = 'node_modules/three/examples/js/libs/basis/'

    this.extensionTypeMap.set('gltf', 'model/gltf+json')
    this.extensionTypeMap.set('glb', 'model/gltf-binary')
    this.extensionTypeMap.set('basis', 'image/basis')
  }

  async _loadFile({ src, type, scale = 1, offset = new Vector3(), meshOptimizer = false }) {
    if (type.startsWith('model')) {
      const [, path, file] = /(.*[\/\\])(.*$)/.exec(src)

      if (!gltfLoader) {
        gltfLoader = new GLTFLoader(undefined)
        dracoLoader = new DRACOLoader(undefined)
        dracoLoader.setWorkerLimit(2)
        gltfLoader.setDRACOLoader(dracoLoader)
        ktx2Loader = new KTX2Loader()
        gltfLoader.setKTX2Loader(ktx2Loader)
        ktx2Loader.detectSupport(getEmptyRenderer())
      }

      if (meshOptimizer && !meshOptimizerInitialized) {
        await import('./meshoptimizerdecoder/meshopt_decoder.js')
        const { EXT_meshopt_compression } = await import('./meshoptimizerdecoder/THREE.EXT_meshopt_compression.js')
        gltfLoader.register(function (parser) {
          const res = new EXT_meshopt_compression(parser, MeshoptDecoder)
          res.name = 'MESHOPT_compression'
          return res
        })
        meshOptimizerInitialized = true
      }

      dracoLoader.setDecoderPath(`${this.baseURI}${this.dracoDecoderPath}`)
      ktx2Loader.setTranscoderPath(`${this.baseURI}${this.basisTranscoderPath}`)
      gltfLoader.setPath(path)

      return new Promise((resolve) => {
        gltfLoader.load(file, (data) => {
          computeSceneGeometry(data.scene, scale, offset)
          resolve(data)
        })
      })
    } else if (type === 'image/basis') {
      if (!basisLoader) {
        basisLoader = new BasisTextureLoader(undefined)
        basisLoader.setWorkerLimit(2)
        basisLoader.detectSupport(getEmptyRenderer())
      }
      basisLoader.setTranscoderPath(`${this.baseURI}${this.basisTranscoderPath}`)
      return new Promise((resolve) => {
        basisLoader.load(src, (texture) => {
          resolve(texture)
        })
      })
    } else if (type.startsWith('image') || type.startsWith('video')) {
      return new Promise((resolve) => {
        new TextureLoader().load(src, (texture) => {
          resolve(texture)
        })
      })
    } else {
      return super._loadFile({ src, type })
    }
  }
}

export default new THREELoader()
