import fs from 'fs-extra';

/**
 * @param {Object} object
 * @param {String} [object.scope=$rootScope] Package scope
 * @param {String} [object.name=$rootName] Package name
 * @param {String} [object.path=./packages] Output path
 */
export default function ({ name, scope, path }) {
  fs.outputFileSync(`${path}/${name}/package.json`, JSON.stringify({
    name: `@${scope}/${name}`,
    private: true,
    version: '0.0.0',
  }, null, 2));
}
