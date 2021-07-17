import fs from 'fs-extra'

/**
 * @param {Object} object
 * @param {String} object.name Package name
 * @param {String} [object.scope=damienmortini] Package scope
 */
export default function ({ name, scope = 'damienmortini' }) {
  fs.outputFileSync(`./packages/${name}/package.json`, JSON.stringify({
    name: `@${scope}/${name}`,
    private: true,
    version: '0.0.0',
  }, null, 2))
}
