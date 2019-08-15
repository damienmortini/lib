const fs = require("fs");

const files = new Map([
  ["./node_modules/three/examples/jsm/loaders/GLTFLoader.js", "./node_modules/@damienmortini/three/loader/_GLTFLoader.js"],
  ["./node_modules/three/examples/jsm/loaders/DRACOLoader.js", "./node_modules/@damienmortini/three/loader/_DRACOLoader.js"],
]);

for (const [source, destination] of files) {
  fs.copyFileSync(source, destination);
  const data = fs.readFileSync(destination, "utf-8");
  const newValue = data.replace("../../../build/three.module.js", "../../../three/src/Three.js");
  fs.writeFileSync(destination, newValue, "utf-8");
}
