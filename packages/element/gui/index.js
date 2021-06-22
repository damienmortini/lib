import GUIFolderElement from './GUIFolderElement.js';

import InputButtonElement from '../element-input-button/index.js';
import InputCheckboxElement from '../element-input-checkbox/index.js';
import InputColorElement from '../element-input-color/index.js';
import InputRangeElement from '../element-input-range/index.js';
import InputSelectElement from '../element-input-select/index.js';
import InputTextElement from '../element-input-text/index.js';
import GUIServer from '../gui-server/index.js';

const STORAGE_ID = 'GUI.data';

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

const valuesMap = new Map([
  ...JSON.parse(localStorage.getItem(STORAGE_ID)) ?? [],
  ...JSON.parse(sessionStorage.getItem(STORAGE_ID)) ?? [],
  ...JSON.parse(new URLSearchParams(location.hash.slice(1)).get('gui')) ?? [],
]);

export default class GUIElement extends GUIFolderElement {
  static get observedAttributes() {
    return ['server', ...GUIFolderElement.observedAttributes];
  }

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

    this.addEventListener('reset', (event) => {
      const node = event.detail.node;
      if (node.defaultValue !== undefined) node.value = node.defaultValue;
    });

    this.addEventListener('toggle', () => {
      if (this.open) {
        sessionStorage.removeItem('GUI.close');
      } else {
        sessionStorage.setItem('GUI.close', '');
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    switch (name) {
      case 'server':
        GUIServer.get(oldValue)?.disconnect(this);
        GUIServer.get(newValue).connect(this);
        break;
    }
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

    const { tagName, object, key, folder, reload, saveToLocalStorage, saveToSessionStorage, saveToURL, watch } = options;
    delete options.tagName;
    delete options.object;
    delete options.key;
    delete options.folder;
    delete options.reload;
    delete options.saveToLocalStorage;
    delete options.saveToSessionStorage;
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

    // Set value
    if (value !== undefined) {
      element.value = value;
      element.defaultValue = value;
    }

    const onElementChange = () => {
      if (object) object[key] = element.value;
    };
    element.addEventListener('change', onElementChange);

    if (onchange) {
      element.onchange = onchange;
    }

    if (options.id) {
      const savedValue = valuesMap.get(options.id);
      if (savedValue !== undefined) element.value = savedValue;
    }

    // Update URL params and reload if needed
    const saveValue = () => {
      if (options.id) {
        if (JSON.stringify(element.value) === JSON.stringify(element.defaultValue)) valuesMap.delete(options.id);
        else valuesMap.set(options.id, element.value);
      }
      if (saveToURL) {
        const urlSearchParams = new URLSearchParams(location.hash.slice(1));
        if (valuesMap.size) urlSearchParams.set('gui', JSON.stringify([...valuesMap]));
        else urlSearchParams.delete('gui');
        location.hash = urlSearchParams.toString();
      }
      if (saveToSessionStorage) {
        if (valuesMap.size) sessionStorage.setItem(STORAGE_ID, JSON.stringify([...valuesMap]));
        else sessionStorage.removeItem(STORAGE_ID);
      }
      if (saveToLocalStorage) {
        if (valuesMap.size) localStorage.setItem(STORAGE_ID, JSON.stringify([...valuesMap]));
        else localStorage.removeItem(STORAGE_ID);
      }
    };
    let timeout;
    element.addEventListener('change', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        saveValue();
        if (reload) {
          window.location.reload();
        }
      }, 100);
    });

    // Watch value change
    if (watch) {
      const updateInputValue = (time) => {
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

    folderElement.appendChild(element);

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
