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
  const fullElementName = `${elementScope.toLowerCase()}-${elementName.replaceAll(' ', '').toLowerCase()}`
  const fullPath = `${path}/${fullElementName}`
  fs.outputFileSync(`${fullPath}/package.json`, JSON.stringify({
    name: `@${scope}/${fullElementName}`,
    private: true,
    version: '0.0.0',
  }, null, 2))
  let indexFileContent = fs.readFileSync(`${__dirname}/template.js`, { encoding: 'utf-8' })
  indexFileContent = indexFileContent.replaceAll('template-element', fullElementName)
  indexFileContent = indexFileContent.replaceAll('template title', elementName)
  const elementClass = `${elementScope} ${elementName}`.replace(/(^| )(.)/g, (result) => result.replace(' ', '').toUpperCase()) + 'Element'
  indexFileContent = indexFileContent.replaceAll('TemplateElement', elementClass)
  fs.writeFileSync(`${fullPath}/index.js`, indexFileContent)
}
