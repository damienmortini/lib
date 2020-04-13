import GUIFolderElement from './GUIFolderElement.js';

import InputButtonElement from '/node_modules/@damienmortini/element-input-button/index.js';
import InputCheckboxElement from '/node_modules/@damienmortini/element-input-checkbox/index.js';
import InputColorElement from '/node_modules/@damienmortini/element-input-color/index.js';
import InputRangeElement from '/node_modules/@damienmortini/element-input-range/index.js';
import InputSelectElement from '/node_modules/@damienmortini/element-input-select/index.js';
import InputTextElement from '/node_modules/@damienmortini/element-input-text/index.js';

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
      }
    `);

    this.autoSaveToURL = false;

    this._summary.textContent = 'GUI';

    this._elementDataMap = new Map();

    this._foldersMap = new Map();

    this.addEventListener('toggle', () => {
      this._updateFolderCloseState(this, 'GUI.close');
    });
  }

  connectedCallback() {
    this.close = sessionStorage.getItem(`GUI.close`) !== null;
  }

  get folders() {
    return this._foldersMap;
  }

  _updateFolderCloseState(folder, path) {
    if (folder.close) {
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

    let urlValue;

    if (options.id) {
      urlValue = valuesMap.get(options.id);
      if (urlValue !== undefined) {
        if (options.object) {
          options.object[options.key] = urlValue;
        }
      }
    }

    if (options.object) {
      options.value = options.object[options.key];
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
          folderElement.close = sessionStorage.getItem(`GUI["${currentPath}"].close`) !== null;
          folderElement.addEventListener('toggle', (event) => {
            this._updateFolderCloseState(event.target, `GUI["${currentPath}"].close`);
          });
          parentFolderElement.appendChild(folderElement);
          this._foldersMap.set(currentPath, folderElement);
        }
        parentFolderElement = folderElement;
      }
    }

    const element = document.createElement(tagName);
    for (const [key, value] of Object.entries(options)) {
      element[key] = value;
    }
    folderElement.appendChild(element);

    if (urlValue !== undefined) {
      element.value = urlValue;
    }

    let timeout;
    element.addEventListener('input', () => {
      if (options.id) {
        valuesMap.set(options.id, element.value);
      }
      if (object) {
        object[key] = element.value;
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

customElements.define('damo-gui', class DamoGUIElement extends GUIElement { });
