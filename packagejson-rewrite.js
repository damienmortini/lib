import fs from 'fs';
import fastGlob from 'fast-glob';

const fileNames = fastGlob.sync(['packages/**/package.json']);
for (const fileName of fileNames) {
  const packageData = JSON.parse(fs.readFileSync(fileName));
  console.log(packageData.publishConfig);
}
