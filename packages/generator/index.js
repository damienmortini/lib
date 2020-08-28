#!/usr/bin/env node

import jsdoc2md from 'jsdoc-to-markdown';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

(async function () {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const generatorName = process.argv[2];

  const jsDocData = jsdoc2md.getTemplateDataSync({ files: `${__dirname}/generators/${generatorName}.js` });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const params = [];
  for (const param of jsDocData[0].params) {
    params.push(await new Promise((resolve) => {
      rl.question(`${param.description}${param.defaultvalue ? ' [' + param.defaultvalue + ']' : ''}: `, (answer) => {
        resolve(answer || param.defaultvalue);
      });
    }));
  }

  rl.close();

  import(`./generators/${generatorName}.js`).then((value) => {
    value.default(...params);
  });
})();
