const fs = require('fs');

const files = new Map([
  ['../../three/examples/jsm/loaders/BasisTextureLoader.js', './loader/_BasisTextureLoader.js'],
  ['../../three/examples/jsm/loaders/GLTFLoader.js', './loader/_GLTFLoader.js'],
  ['../../three/examples/jsm/loaders/DRACOLoader.js', './loader/_DRACOLoader.js'],
  ['../../three/examples/jsm/objects/Lensflare.js', './object/_Lensflare.js'],
]);
for (const [source, destination] of files) {
  fs.copyFileSync(source, destination);
  const data = fs.readFileSync(destination, 'utf-8');
  const newValue = data.replace('../../../build/three.module.js', '../../../three/src/Three.js');
  fs.writeFileSync(destination, newValue, 'utf-8');
}
