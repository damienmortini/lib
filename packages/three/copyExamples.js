const fs = require('fs-extra')

const files = new Map([
  [require.resolve('three/examples/jsm/loaders/BasisTextureLoader.js'), './examples/loaders/BasisTextureLoader.js'],
  [require.resolve('three/examples/jsm/loaders/GLTFLoader.js'), './examples/loaders/GLTFLoader.js'],
  [require.resolve('three/examples/jsm/loaders/DRACOLoader.js'), './examples/loaders/DRACOLoader.js'],
  [require.resolve('three/examples/jsm/objects/Lensflare.js'), './examples/objects/Lensflare.js'],
  [require.resolve('three/examples/jsm/utils/BufferGeometryUtils.js'), './examples/utils/BufferGeometryUtils.js'],
])
for (const [source, destination] of files) {
  fs.copySync(source, destination)
  const data = fs.readFileSync(destination, 'utf-8')
  const newValue = data.replace('from \'three\'', 'from \'../../../../three/src/Three.js\'')
  fs.writeFileSync(destination, newValue, 'utf-8')
}
