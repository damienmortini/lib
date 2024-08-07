#!/usr/bin/env node

import fs from 'fs-extra';
import jsdoc2md from 'jsdoc-to-markdown';
import { dirname } from 'path';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url'
;(async function () {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const generatorName = process.argv[2];

  const jsDocData = jsdoc2md.getTemplateDataSync({ files: `${__dirname}/generators/${generatorName}/index.js` });

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const rootPackage = fs.readJSONSync(`./package.json`);
  const rootPackageNameSplitted = rootPackage.name.split('/');
  const defaultsMap = new Map([
    ['$rootPackageName', rootPackage.name],
    ['$rootScope', rootPackageNameSplitted.length > 1 ? rootPackageNameSplitted[0].slice(1) : ''],
    ['$rootName', rootPackageNameSplitted[1] ?? rootPackageNameSplitted[0]],
  ]);
  const options = {};

  for (const parameter of jsDocData[0].params) {
    if (!parameter.description) continue;
    const name = parameter.name.split('.')[1];
    let defaultValue = parameter.defaultvalue;
    options[name] = await new Promise((resolve) => {
      rl.question(`${parameter.description}: `, (answer) => {
        resolve(answer);
      });
      if (defaultValue) {
        for (const [key, value] of defaultsMap) {
          defaultValue = defaultValue.replace(key, value);
        }
        rl.write(defaultValue);
      }
    });
  }

  rl.close();

  import(`./generators/${generatorName}/index.js`).then(async (value) => {
    await value.default(options);
  });
})();
