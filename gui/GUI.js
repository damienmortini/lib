import WebSocket from "../utils/WebSocket.js";
import Keyboard from "../input/Keyboard.js";
import GUIInput from "./GUIInput.js";

let staticGUI;

// STYLES

let style = document.createElement("style");
document.head.appendChild(style);
style.sheet.insertRule(`
  dlib-gui {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 250px;
    padding: 5px;
    color: white;
    font-family: monospace;
    max-height: 100%;
    box-sizing: border-box;
    overflow: auto;
  }
`, 0);
style.sheet.insertRule(`
  dlib-gui dlib-guiinput {
    margin: 5px 0;
  }
`, 0);
style.sheet.insertRule(`
  dlib-gui details details {
    margin: 10px;
  }
`, 0);
style.sheet.insertRule(`
  dlib-gui details summary {
    cursor: pointer;
  }
`, 0);
style.sheet.insertRule(`
  dlib-gui details summary:focus {
    outline: none;
  }
`, 0);

// UTILS

function componentToHex(c) {
  let hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r * 255) + componentToHex(g * 255) + componentToHex(b * 255);
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
}

function colorFromHex(color, hex) {
  if (typeof color === "string") {
    return hex;
  }

  let colorValue = hexToRgb(hex);

  if (color.r !== undefined) {
    Object.assign(color, colorValue);
  } else if (color.x !== undefined) {
    [color.x, color.y, color.z] = [colorValue.r, colorValue.g, colorValue.b];
  } else {
    [color[0], color[1], color[2]] = [colorValue.r, colorValue.g, colorValue.b];
  }

  return color;
}

function colorToHex(color) {
  if (typeof color === "string") {
    return color;
  }
  return rgbToHex(
    color.r !== undefined ? color.r : color.x !== undefined ? color.x : color[0],
    color.g !== undefined ? color.g : color.y !== undefined ? color.y : color[1],
    color.b !== undefined ? color.b : color.z !== undefined ? color.z : color[2]
  );
}

function normalizeString(string) {
  return `${string.toLowerCase().replace(/[^\w-]/g, "")}`;
}

function urlHashRegExpFromKey(key) {
  return new RegExp(`([#&]gui/${key}=)([^=&#?]*)`, "g");
}

// GUI

const GUI_REG_EXP = /([#&]gui=)((%7B|{).*(%7D|}))([&?]*)/;

let DATA = {};
(function() {
  let matches = GUI_REG_EXP.exec(window.location.hash);
  if (matches) {
    let string = matches[2];
    string = string.replace(/”|%E2%80%9D/g, "%22");
    window.location.hash = window.location.hash.replace(GUI_REG_EXP, `$1${string}$5`);
    DATA = JSON.parse(decodeURI(string));
  }
})();

export default class GUI extends HTMLElement {
  static _addStatic() {
    if (staticGUI) {
      return;
    }
    staticGUI = document.createElement("dlib-gui");
    document.body.appendChild(staticGUI);
  }

  static add(...params) {
    GUI._addStatic();
    return staticGUI.add(...params);
  }

  static get element() {
    return staticGUI;
  }

  static get data() {
    return DATA;
  }

  static set visible(value) {
    GUI._addStatic();
    staticGUI.visible = value;
  }

  static get visible() {
    return staticGUI.visible;
  }

  static set open(value) {
    GUI._addStatic();
    staticGUI.open = value;
  }

  static get open() {
    return staticGUI.open;
  }

  static set serverUrl(value) {
    GUI._addStatic();
    staticGUI.serverUrl = value;
  }

  constructor({serverUrl} = {}) {
    super();

    this.serverUrl = serverUrl;

    this._groups = new Map();
    this._inputs = new Map();
    this._uids = new Set();

    this._container = document.createElement("details");
    this._container.innerHTML = "<summary>GUI</summary>";

    this.open = true;
  }

  set serverUrl(value) {
    this._serverUrl = value;

    if(this._webSocket) {
      this._webSocket.removeEventListener("message", this._onWebSocketMessage);
      this._webSocket.close();
      this._webSocket = null;
    }
    if(!this._serverUrl) {
      return;
    }
    this._webSocket = new WebSocket(this._serverUrl);
    this._onWebSocketMessage = (e) => {
      let data = JSON.parse(e.data);
      let input = this._inputs.get(data.uid);
      if(input._client) {
        if(input.type === "button") {
          input.value();
        } else {
          input.value = data.value;
        }
      }
    }
    this._webSocket.addEventListener("message", this._onWebSocketMessage);
  }

  get serverUrl() {
    return this._serverUrl;
  }

  set visible(value) {
    this.style.display = value ? "" : "none";
  }

  get visible() {
    return this.style.visibility === "visible";
  }

  update() {
    for (let input of this._inputs.values()) {
      input.update();
    }
  }

  set open(value) {
    this._container.open = value;
  }

  get open() {
    return this._container.open;
  }

  add(object, key, {type, label = key, id = label, group = "", reload = false, remote = false, client = remote, onChange = () => {
      }, options, max, min, step} = {}) {
    if(object[key] === null || object[key] === undefined) {
      console.error(`GUI: ${id} must be defined.`);
      return;
    }

    let idKey = normalizeString(id);
    let groupKey = normalizeString(group);
    let uid = groupKey ? `${groupKey}/${idKey}` : idKey;

    if(this._uids.has(uid)) {
      console.error(`GUI: An input with id ${id} already exist in the group ${group}`);
      return;
    }

    this._uids.add(uid);

    if(remote && !this.serverUrl) {
      this._serverUrl = `wss://${location.hostname}:80`;
    }

    type = type || (options ? "select" : "");

    if (!type) {
      switch (typeof object[key]) {
        case "boolean":
          type = "checkbox";
          break;
        case "string":
          type = "text";
          break;
        case "function":
          type = "button";
          break;
        default:
          type = typeof object[key];
      }
    }

    if (!this._container.parentNode) {
      this.appendChild(this._container);
    }
    let container = this._container;
    if(groupKey) {
      container = this._groups.get(groupKey);
      if(!container) {
        container = document.createElement("details");
        container.innerHTML = `<summary>${group}</summary>`;
        this._groups.set(groupKey, container);
        this._container.appendChild(container);
      }
    }
    let input = document.createElement("dlib-guiinput");
    input.object = type === "color" ? {
      value: "#000000"
    } : object;
    input.key = type === "color" ? "value" : key;
    input.label = label;
    input.value = (type === "color" ? colorToHex(object[key]) : object[key]);
    input._client = client;
    if (min) {
      input.min = min;
    }
    if (max) {
      input.max = max;
    }
    if (step) {
      input.step = step;
    }
    if (options) {
      input.options = options;
    }
    input.type = type;
    container.appendChild(input);

    const SAVED_VALUE = groupKey && DATA[groupKey] ? DATA[groupKey][idKey] : DATA[idKey];
    if(SAVED_VALUE !== undefined) {
      input.value = SAVED_VALUE;
      if (type === "color") {
        object[key] = colorFromHex(object[key], SAVED_VALUE);
      }
    }

    const onValueChange = (value) => {
      let containerData = groupKey ? DATA[groupKey] : DATA;
      if (!containerData) {
        containerData = DATA[groupKey] = {};
      }
      containerData[idKey] = input.value;

      if (GUI_REG_EXP.test(window.location.hash)) {
        window.location.hash = window.location.hash.replace(GUI_REG_EXP, `$1${encodeURI(JSON.stringify(DATA))}$5`);
      } else {
        let prefix = window.location.hash ? "&" : "#";
        window.location.hash += `${prefix}gui=${encodeURI(JSON.stringify(DATA))}`;
      }

      if(remote && this._webSocket) {
        this._webSocket.send(JSON.stringify({uid, value}));
      }

      if (reload) {
        if (Keyboard.hasKeyDown(Keyboard.SHIFT)) {
          Keyboard.addEventListener("keyup", function reloadLocation() {
            Keyboard.removeEventListener("keyup", reloadLocation);
            window.location.reload();
          });
        } else {
          window.location.reload();
        }
      }

      onChange(value);
    }


    // TODO: Clean here

    if (type === "button") {
      input.addEventListener("click", onValueChange);
    } else {

      let animationFrameId = -1;
      const onValueChangeTmp = () => {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          if (type === "color") {
            onValueChange(colorFromHex(object[key], input.value));
          } else {
            onValueChange(input.value);
          }
        });
      }

      if (type !== "text") {
        input.addEventListener("input", onValueChangeTmp);
      }
      input.addEventListener("change", onValueChangeTmp);
    }

    onChange(object[key]);

    this._inputs.set(uid, input);

    return input;
  }
}

window.customElements.define("dlib-gui", GUI);
