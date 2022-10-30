import fs from 'fs-extra'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * @param {Object} object
 * @param {String} [object.template=basic] Element template
 * @param {String} [object.scope=$rootScope] Package scope
 * @param {String} [object.elementScope=$rootName] Element scope
 * @param {String} object.elementName Element name
 * @param {String} [object.path=./packages] Output path
 */
export default function ({ template, elementScope, elementName, scope, path }) {
  const flattenElementname = elementName.replaceAll(' ', '').toLowerCase()
  const fullElementName = `${elementScope}-${flattenElementname}`.replaceAll(' ', '').toLowerCase()
  const fullPath = `${path}/${flattenElementname}`
  fs.mkdirSync(fullPath)
  const fileNames = fs.readdirSync(`${__dirname}/templates/${template}`)
  let packageJSON = {}
  for (const fileName of fileNames) {
    if (fileName === '_package.json') {
      packageJSON = fs.readJSONSync(`${__dirname}/templates/${template}/${fileName}`)
    } else if (fileName === 'index.js') {
      let indexFileContent = fs.readFileSync(`${__dirname}/templates/${template}/${fileName}`, { encoding: 'utf-8' })
      indexFileContent = indexFileContent.replaceAll('template-element', fullElementName)
      indexFileContent = indexFileContent.replaceAll('template title', elementName)
      const elementClass = `${elementScope} ${elementName} Element`.replaceAll(/(\s+|^)(.)/g, (match, captureGroup1, captureGroup2) => captureGroup2.toUpperCase())
      indexFileContent = indexFileContent.replaceAll('TemplateElement', elementClass)
      fs.writeFileSync(`${fullPath}/${fileName}`, indexFileContent)
    } else {
      fs.copyFileSync(`${__dirname}/templates/${template}/${fileName}`, `${fullPath}/${fileName}`)
    }
  }
  fs.outputFileSync(`${fullPath}/package.json`, JSON.stringify({
    name: `@${scope}/${flattenElementname}`,
    private: true,
    version: '0.0.0',
    ...packageJSON,
  }, null, 2))
}
