import GUIFolderElement from './GUIFolderElement.js';

import InputButtonElement from '../element-input-button/index.js';
import InputCheckboxElement from '../element-input-checkbox/index.js';
import InputColorElement from '../element-input-color/index.js';
import InputRangeElement from '../element-input-range/index.js';
import InputSelectElement from '../element-input-select/index.js';
import InputTextElement from '../element-input-text/index.js';

const customElementsMap = new Map(Object.entries({
  'gui-folder': GUIFolderElement,
  'gui-input-button': InputButtonElement,
  'gui-input-checkbox': InputCheckboxElement,
  'gui-input-color': InputColorElement,
  'gui-input-range': InputRangeElement,
  'gui-input-select': InputSelectElement,
  'gui-input-text': InputTextElement,
}));

for (const [customElementName, customElementConstructor] of customElementsMap) {
  if (!customElements.get(customElementName)) {
    customElements.define(customElementName, class extends customElementConstructor { });
  }
}

const tagNameResolvers = new Map([
  ['gui-input-button', (attributes) => !!attributes.onclick],
  ['gui-input-select', (attributes) => !!attributes.options],
  ['gui-input-color', (attributes) => {
    return typeof attributes.value === 'string' && ((attributes.value.length === 7 && attributes.value.startsWith('#')) || attributes.value.startsWith('rgb') || attributes.value.startsWith('hsl')) || (typeof attributes.value === 'object' && attributes.value.r !== undefined && attributes.value.g !== undefined && attributes.value.b !== undefined);
  }],
  ['gui-input-text', (attributes) => typeof attributes.value === 'string'],
  ['gui-input-range', (attributes) => typeof attributes.value === 'number'],
  ['gui-input-checkbox', (attributes) => typeof attributes.value === 'boolean'],
]);

const valuesMap = new Map(JSON.parse(new URLSearchParams(location.hash.slice(1)).get('gui')));

export default class GUIElement extends GUIFolderElement {
  constructor() {
    super();

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
    `);

    this.autoSaveToURL = false;

    this._summary.textContent = 'GUI';

    this._elementDataMap = new Map();

    this._foldersMap = new Map();

    this.addEventListener('toggle', () => {
      if (this.open) {
        sessionStorage.removeItem('GUI.close');
      } else {
        sessionStorage.setItem('GUI.close', '');
      }
    });
  }

  connectedCallback() {
    this.open = sessionStorage.getItem('GUI.close') === null;
  }

  get folders() {
    return this._foldersMap;
  }

  _updateFolderOpenState(folder, path) {
    if (folder.open) {
      sessionStorage.setItem(path, '');
    } else {
      sessionStorage.removeItem(path);
    }
  }

  add(options) {
    options = Object.assign({}, options);

    if (options.id === undefined && options.key !== undefined) {
      options.id = `${options.folder ? options.folder + '/' : ''}${options.key}`;
    }

    if (options.object) {
      if (options.value !== undefined) options.object[options.key] = options.value;
      else options.value = options.object[options.key];
    }

    if (!options.tagName) {
      options.tagName = 'gui-input-text';
      for (const [tagName, resolve] of tagNameResolvers) {
        if (resolve(options)) {
          options.tagName = tagName;
          break;
        }
      }
    }

    options.saveToURL = this.autoSaveToURL || options.saveToURL;

    const { tagName, object, key, folder, reload, saveToURL, watch } = options;
    delete options.tagName;
    delete options.object;
    delete options.key;
    delete options.folder;
    delete options.reload;
    delete options.saveToURL;
    delete options.watch;

    let folderElement = this;

    if (folder) {
      const folderNames = folder.split('/');
      let path = '';
      let parentFolderElement = this;
      for (const folderName of folderNames) {
        if (path) {
          path += '/';
        }
        path += folderName;
        folderElement = this._foldersMap.get(path);
        if (!folderElement) {
          folderElement = document.createElement('gui-folder');
          folderElement.name = folderName;
          const currentPath = path;
          folderElement.open = sessionStorage.getItem(`GUI["${currentPath}"].open`) !== null;
          folderElement.addEventListener('toggle', (event) => {
            this._updateFolderOpenState(event.target, `GUI["${currentPath}"].open`);
          });
          parentFolderElement.appendChild(folderElement);
          this._foldersMap.set(currentPath, folderElement);
        }
        parentFolderElement = folderElement;
      }
    }

    const element = document.createElement(tagName);

    const value = options.value;
    delete options.value;

    const onchange = options.onchange;
    delete options.onchange;

    for (const [key, value] of Object.entries(options)) {
      element[key] = value;
    }

    element.value = value;

    let timeout;
    element.addEventListener('change', () => {
      if (object) {
        object[key] = element.value;
      }

      if (options.id) {
        valuesMap.set(options.id, element.value);
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (saveToURL) {
          const urlSearchParams = new URLSearchParams(location.hash.slice(1));
          if (valuesMap.size) {
            urlSearchParams.set('gui', JSON.stringify([...valuesMap]));
          } else {
            urlSearchParams.delete('gui');
          }
          location.hash = urlSearchParams.toString();
        }
        if (reload) {
          window.location.reload();
        }
      }, 100);
    });

    if (onchange) {
      element.onchange = onchange;
    }

    if (options.id) {
      const urlValue = valuesMap.get(options.id);
      if (urlValue !== undefined) element.value = urlValue;
    }

    folderElement.appendChild(element);

    if (watch) {
      const updateInputValue = () => {
        if (!element.parentElement) {
          return;
        }
        requestAnimationFrame(updateInputValue);
        element.value = object[key];
      };
      requestAnimationFrame(updateInputValue);
    }

    if (object) {
      this._elementDataMap.set(element, {
        object,
        key,
      });
    }

    return element;
  }

  _updateChildrenValues(children) {
    for (const child of children) {
      if (!child.parentElement) {
        this._elementDataMap.delete(child);
        continue;
      }
      const data = this._elementDataMap.get(child);
      if ('value' in child && data) {
        child.value = data.object[data.key];
      }
      if (child.children) {
        this._updateChildrenValues(child.children);
      }
    }
  }

  update() {
    this._updateChildrenValues(this.children);
  }
}

if (!customElements.get('damo-gui')) {
  customElements.define('damo-gui', class DamoGUIElement extends GUIElement { });
}
