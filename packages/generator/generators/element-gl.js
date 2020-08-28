import fs from 'fs-extra';

/**
 * @param {String} name Element name
 */
export default function (name) {
  fs.copySync('node_modules/@damienmortini/element-starter-gl', `./packages/${name}`);
  fs.outputFileSync(`./packages/${name}/package.json`, JSON.stringify({
    name: `@damienmortini/${name}`,
    private: true,
    version: '0.0.1',
  }, null, 2));
};
