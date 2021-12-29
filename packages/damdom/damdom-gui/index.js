import DamdomGUIFolderElement from './DamdomGUIFolderElement.js'

import '../damdom-checkbox/index.js'
import '../damdom-colorpicker/index.js'
import '../damdom-slider/index.js'
import '../damdom-select/index.js'
import '../damdom-textfield/index.js'

const STORAGE_ID = 'damdom-gui:data'

const tagNameResolvers = new Map([
  ['damdom-select', (attributes) => !!attributes.options],
  ['damdom-colorpicker', (attributes) => {
    return typeof attributes.value === 'string' && ((attributes.value.length === 7 && attributes.value.startsWith('#')) || attributes.value.startsWith('rgb') || attributes.value.startsWith('hsl')) || (typeof attributes.value === 'object' && attributes.value.r !== undefined && attributes.value.g !== undefined && attributes.value.b !== undefined)
  }],
  ['damdom-textfield', (attributes) => typeof attributes.value === 'string'],
  ['damdom-slider', (attributes) => typeof attributes.value === 'number'],
  ['damdom-checkbox', (attributes) => typeof attributes.value === 'boolean'],
])

const urlValuesMap = new Map(JSON.parse(new URLSearchParams(location.hash.slice(1)).get('gui')) ?? [])
const localStorageValuesMap = new Map(JSON.parse(localStorage.getItem(STORAGE_ID)) ?? [])
const sessionStorageValuesMap = new Map(JSON.parse(sessionStorage.getItem(STORAGE_ID)) ?? [])

export default class DamdomGUIElement extends DamdomGUIFolderElement {
  #elementDataMap
  #foldersMap

  constructor() {
    super()

    this.shadowRoot.querySelector('style').insertAdjacentHTML('beforeend', `
      :host {
        width: 250px;
        padding: 10px 0;
        box-sizing: border-box;
      }
      :host::-webkit-scrollbar {
        background: transparent;
        height: 2px;
        width: 2px;
      }
      :host::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, .2);
      }
    `)

    this.#elementDataMap = new Map()

    this.#foldersMap = new Map()

    this.addEventListener('toggle', () => {
      if (this.open) {
        sessionStorage.removeItem('damdom-gui:close')
      } else {
        sessionStorage.setItem('damdom-gui:close', '')
      }
    })

    window.addEventListener('damdom-gui:add', (event) => {
      this.add(event.detail.options)
    })
  }

  connectedCallback() {
    if (!this.name) this.name = '🪄 GUI'
    this.open = sessionStorage.getItem('damdom-gui:close') === null
  }

  get folders() {
    return this.#foldersMap
  }

  #updateFolderOpenState(folder, path) {
    if (folder.open) {
      sessionStorage.setItem(path, '')
    } else {
      sessionStorage.removeItem(path)
    }
  }

  add(options) {
    options = Object.assign({}, options)

    if (options.id === undefined && options.key !== undefined) {
      options.id = `${options.folder ? options.folder + '/' : ''}${options.key}`
    }

    if (options.object) {
      if (options.value !== undefined) options.object[options.key] = options.value
      else options.value = options.object[options.key]
    }

    if (!options.tagName) {
      options.tagName = 'gui-input-text'
      for (const [tagName, resolve] of tagNameResolvers) {
        if (resolve(options)) {
          options.tagName = tagName
          break
        }
      }
    }

    const { tagName, object, key, folder, reload, saveToLocalStorage, saveToSessionStorage, saveToURL, watch } = options
    delete options.tagName
    delete options.object
    delete options.key
    delete options.folder
    delete options.reload
    delete options.saveToLocalStorage
    delete options.saveToSessionStorage
    delete options.saveToURL
    delete options.watch

    let folderElement = this

    if (folder) {
      const folderNames = folder.split('/')
      let path = ''
      let parentFolderElement = this
      for (const folderName of folderNames) {
        if (path) {
          path += '/'
        }
        path += folderName
        folderElement = this.#foldersMap.get(path)
        if (!folderElement) {
          folderElement = document.createElement('damdom-guifolder')
          folderElement.name = folderName
          const currentPath = path
          folderElement.open = sessionStorage.getItem(`GUI["${currentPath}"].open`) !== null
          folderElement.addEventListener('toggle', (event) => {
            this.#updateFolderOpenState(event.target, `GUI["${currentPath}"].open`)
          })
          parentFolderElement.appendChild(folderElement)
          this.#foldersMap.set(currentPath, folderElement)
        }
        parentFolderElement = folderElement
      }
    }

    const element = document.createElement(tagName)

    const value = options.value
    delete options.value

    const onchange = options.onchange
    delete options.onchange

    for (const [key, value] of Object.entries(options)) {
      element[key] = value
    }

    if ('value' in element) {
      element.value = value
      element.defaultValue = value
    }

    const onElementChange = () => {
      if (object) object[key] = element.value
    }
    element.addEventListener('change', onElementChange)

    if (onchange) {
      element.onchange = onchange
    }

    if (options.id && saveToURL && urlValuesMap.has(options.id)) element.value = urlValuesMap.get(options.id)
    else if (options.id && saveToSessionStorage && sessionStorageValuesMap.has(options.id)) element.value = sessionStorageValuesMap.get(options.id)
    else if (options.id && saveToLocalStorage && localStorageValuesMap.has(options.id)) element.value = localStorageValuesMap.get(options.id)

    // Update URL params and reload if needed
    const saveValue = () => {
      let needsUpdate = true
      if (JSON.stringify(element.value) === JSON.stringify(element.defaultValue)) {
        urlValuesMap.delete(options.id)
        sessionStorageValuesMap.delete(options.id)
        localStorageValuesMap.delete(options.id)
        needsUpdate = false
      }
      if (saveToURL) {
        if (needsUpdate) urlValuesMap.set(options.id, element.value)
        const urlSearchParams = new URLSearchParams(location.hash.slice(1))
        if (urlValuesMap.size) urlSearchParams.set('gui', JSON.stringify([...urlValuesMap]))
        else urlSearchParams.delete('gui')
        location.hash = urlSearchParams.toString()
      }
      if (saveToSessionStorage) {
        if (needsUpdate) sessionStorageValuesMap.set(options.id, element.value)
        if (sessionStorageValuesMap.size) sessionStorage.setItem(STORAGE_ID, JSON.stringify([...sessionStorageValuesMap]))
        else sessionStorage.removeItem(STORAGE_ID)
      }
      if (saveToLocalStorage) {
        if (needsUpdate) localStorageValuesMap.set(options.id, element.value)
        if (localStorageValuesMap.size) localStorage.setItem(STORAGE_ID, JSON.stringify([...localStorageValuesMap]))
        else localStorage.removeItem(STORAGE_ID)
      }
    }
    let timeout
    element.addEventListener('change', () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        if (options.id) saveValue()
        if (reload) window.location.reload()
      }, 100)
    })

    // Watch value change
    if (watch) {
      const updateInputValue = (time) => {
        if (!element.parentElement) {
          return
        }
        requestAnimationFrame(updateInputValue)
        element.value = object[key]
      }
      requestAnimationFrame(updateInputValue)
    }

    if (object) {
      this.#elementDataMap.set(element, {
        object,
        key,
      })
    }

    folderElement.appendChild(element)

    return element
  }

  #updateChildrenValues(children) {
    for (const child of children) {
      if (!child.parentElement) {
        this.#elementDataMap.delete(child)
        continue
      }
      const data = this.#elementDataMap.get(child)
      if ('value' in child && data) {
        child.value = data.object[data.key]
      }
      if (child.children) {
        this.#updateChildrenValues(child.children)
      }
    }
  }

  update() {
    this.#updateChildrenValues(this.children)
  }
}

customElements.define('damdom-gui', DamdomGUIElement)
