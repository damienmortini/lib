const fs = require('fs');

const files = new Map([
  [require.resolve('three/examples/jsm/loaders/GLTFLoader.js'), './src/loader/_GLTFLoader.js'],
  [require.resolve('three/examples/jsm/loaders/DRACOLoader.js'), './src/loader/_DRACOLoader.js'],
  [require.resolve('three/examples/jsm/objects/Lensflare.js'), './src/object/_Lensflare.js'],
]);

for (const [source, destination] of files) {
  fs.copyFileSync(source, destination);
  const data = fs.readFileSync(destination, 'utf-8');
  const newValue = data.replace('../../../build/three.module.js', '../../../three/src/Three.js');
  fs.writeFileSync(destination, newValue, 'utf-8');
}
