import GUIFolderElement from './GUIFolderElement.js';

import InputButtonElement from '../element-input-button/index.js';
import InputCheckboxElement from '../element-input-checkbox/index.js';
import InputColorPickerElement from '../element-input-colorpicker/index.js';
import InputRangeElement from '../element-input-range/index.js';
import InputSelectElement from '../element-input-select/index.js';
import InputTextElement from '../element-input-text/index.js';

const customElementsMap = new Map(Object.entries({
  'gui-folder': GUIFolderElement,
  'gui-input-button': InputButtonElement,
  'gui-input-checkbox': InputCheckboxElement,
  'gui-input-color': InputColorPickerElement,
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
        max-width: 250px;
      }
    `);

    this._summary.textContent = 'GUI';

    this._foldersMap = new Map();
  }

  add(options) {
    options = Object.assign({}, options);

    if (options.id === undefined && options.key !== undefined) {
      options.id = `${options.folder ? options.folder + '/' : ''}${options.key}`;
    }
    if (!options.id) {
      console.warn(`GUI: ${JSON.stringify(options)} doesn't have any id`);
    }

    const urlValue = valuesMap.get(options.id);

    if (urlValue !== undefined) {
      if (options.object) {
        options.object[options.key] = urlValue;
      }
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

    if (options.object) {
      options.value = options.object[options.key];
    }

    const { object, key, folder, reload } = options;
    delete options.object;
    delete options.key;
    delete options.folder;
    delete options.reload;

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
          folderElement.close = !(sessionStorage.getItem(`GUI[${currentPath}]`) === 'false');
          folderElement.addEventListener('toggle', (event) => {
            sessionStorage.setItem(`GUI[${currentPath}]`, event.target.close);
          });
          parentFolderElement.appendChild(folderElement);
          this._foldersMap.set(currentPath, folderElement);
        }
        parentFolderElement = folderElement;
      }
    }

    const element = document.createElement(options.tagName);
    for (const key in options) {
      if (key === 'tagName') {
        continue;
      }
      element[key] = options[key];
    }
    folderElement.appendChild(element);

    if (urlValue !== undefined) {
      element.value = urlValue;
      element.dispatchEvent(new Event('input'));
    }

    let timeout;
    element.addEventListener('input', () => {
      valuesMap.set(options.id, element.value);
      if (object) {
        object[key] = element.value;
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const urlSearchParams = new URLSearchParams(location.hash.slice(1));
        urlSearchParams.set('gui', JSON.stringify([...valuesMap]));
        location.hash = urlSearchParams.toString();
        if (reload) {
          window.location.reload();
        }
      }, 100);
    });

    return element;
  }
}
