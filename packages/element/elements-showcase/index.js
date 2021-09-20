import ELEMENTS from './elements.js'

const section = document.body.querySelector('section')
const list = document.body.querySelector('nav ul')
const main = document.body.querySelector('main')

for (const [elementName, { preview }] of ELEMENTS) {
  const elementString = preview || `<${elementName}></${elementName}>`
  list.insertAdjacentHTML('beforeend', `
        <li data-elementname="${elementName}">
          <h2><a href="#${elementName}">${elementName.replace('damo-', '')}</a></h2>
          ${elementString}
        </li>
      `)
  import(`../${elementName.replace('damo-', 'element-')}/index.js`)
}

const updatePath = () => {
  const elementName = location.hash.slice(1)
  if (elementName) {
    section.classList.remove('grid')
    main.innerHTML = ELEMENTS.get(elementName).demo || `<${elementName}></${elementName}>`
  } else {
    section.classList.add('grid')
  }
}

updatePath()
window.addEventListener('hashchange', updatePath)
