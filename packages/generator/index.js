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

  const options = {
    scope: /(?!.*@)(.*?)[\\/]/.exec(process.cwd())[1],
  };
  for (const parameter of jsDocData[0].params) {
    if (!parameter.description) continue;
    const name = parameter.name.split('.')[1];
    const defaultValue = options[name] ?? parameter.defaultvalue;
    options[name] = await new Promise((resolve) => {
      rl.question(`${parameter.description}${defaultValue ? ' [' + (defaultValue) + ']' : ''}: `, (answer) => {
        resolve(answer || defaultValue);
      });
    });
  }

  rl.close();

  import(`./generators/${generatorName}.js`).then((value) => {
    value.default(options);
  });
})();
