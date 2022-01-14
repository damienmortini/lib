import fs from 'fs-extra'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * @param {Object} object
 * @param {String} object.elementScope Element scope
 * @param {String} object.elementName Element name
 * @param {String} [object.scope=damienmortini] Package scope
 * @param {String} [object.path=./packages] Output path
 */
export default function ({ elementScope, elementName, scope = 'damienmortini', path = './packages' }) {
  const fullElementName = `${elementScope}-${elementName}`.replaceAll(' ', '').toLowerCase()
  const fullPath = `${path}/${fullElementName}`
  fs.outputFileSync(`${fullPath}/package.json`, JSON.stringify({
    name: `@${scope}/${fullElementName}`,
    private: true,
    version: '0.0.0',
    dependencies: {
      '@damienmortini/core': '0.2.127',
      '@damienmortini/damdom-ticker': '0.0.18',
      '@damienmortini/math': '0.0.4',
      '@damienmortini/webgl': '0.0.6',
    },
  }, null, 2))
  let indexFileContent = fs.readFileSync(`${__dirname}/template/index.js`, { encoding: 'utf-8' })
  indexFileContent = indexFileContent.replaceAll('template-element', fullElementName)
  indexFileContent = indexFileContent.replaceAll('template title', elementName)
  const elementClass = `${elementScope} ${elementName}`.replace(/(^| )(.)/g, (result) => result.replace(' ', '').toUpperCase()) + 'Element'
  indexFileContent = indexFileContent.replaceAll('TemplateElement', elementClass)
  fs.writeFileSync(`${fullPath}/index.js`, indexFileContent)
  fs.copyFileSync(`${__dirname}/template/View.js`, `${fullPath}/View.js`)
}
