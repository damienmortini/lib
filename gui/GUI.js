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
    width: 200px;
    padding: 5px;
    color: white;
    font-family: monospace;
  }
`, 0);
style.sheet.insertRule(`
  dlib-gui dlib-guiinput {
    margin: 5px 0;
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
  if(typeof color === "string") {
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
  if(typeof color === "string") {
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
  if(matches) {
    let string = matches[2];
    string = string.replace(/%7B/g, "{");
    string = string.replace(/%7D/g, "}");
    string = string.replace(/%22/g, "\"");
    window.location.hash = window.location.hash.replace(GUI_REG_EXP, `$1${string}$5`);
    DATA = JSON.parse(string);
  }
})();

export default class GUI extends HTMLElement {
  static add(...params) {
    if(!staticGUI) {
      staticGUI = document.createElement("dlib-gui");
      document.body.appendChild(staticGUI);
    }
    staticGUI.add(...params);
  }

  static set open(value) {
    staticGUI.open = value;
  }

  static get open() {
    return staticGUI.open;
  }

  constructor() {
    super();

    this._groups = new Map();
    this._inputs = [];

    this._container = document.createElement("details");
    this._container.innerHTML = "<summary>GUI</summary>";
    this.open = true;
  }

  update() {
    for (let input of this._inputs) {
      input.update();
    }
  }

  set open(value) {
    this._container.open = value;
  }

  get open() {
    return this._container.open;
  }

  add(object, key, {type, label = key, group = "", reload = false, onChange = () => {}, options, max, min, step} = {}) {

    type = type || (options ? "select" : "");

    if(!type) {
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

    let labelKey = normalizeString(label);
    let groupKey = normalizeString(group);
    const SAVED_VALUE = groupKey && DATA[groupKey] ? DATA[groupKey][labelKey] : DATA[labelKey];
    if(type === "color" && SAVED_VALUE) {
      object[key] = colorFromHex(object[key], SAVED_VALUE);
    }
    let value = SAVED_VALUE || (type === "color" ? colorToHex(object[key]) : object[key]);

    if(!this._container.parentNode) {
      this.appendChild(this._container);
    }
    let container = this._groups.get(group) || this._container;
    let input = document.createElement("dlib-guiinput");
    input.object = type === "color" ? {value: "#000000"} : object;
    input.key = type === "color" ? "value" : key;
    input.label = label;
    input.value = value;
    if(min) {
      input.min = min;
    }
    if(max) {
      input.max = max;
    }
    if(step) {
      input.step = step;
    }
    if(options) {
      input.options = options;
    }
    input.type = type;
    container.appendChild(input);

    const reloadWindow = () => {
      if (!reload) {
        return;
      }

      if(Keyboard.hasKeyDown(Keyboard.SHIFT)) {
        Keyboard.onKeyUp.addOnce(() => {
          window.location.reload();
        }, this);
      } else {
        window.location.reload();
      }
    }

    if(type === "button") {
      input.addEventListener("click", reloadWindow);
    } else {
      if(type !== "color") {
        input.addEventListener("input", () => {
          onChange(input.value);
        });
      }

      let timeoutId = -1;
      input.addEventListener("change", () => {
        let containerData = groupKey ? DATA[groupKey] : DATA;
        if(!containerData) {
          containerData = DATA[groupKey] = {};
        }
        containerData[labelKey] = input.value;

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if(GUI_REG_EXP.test(window.location.hash)) {
            window.location.hash = window.location.hash.replace(GUI_REG_EXP, `$1${JSON.stringify(DATA)}$5`);
          } else {
            let prefix = window.location.hash ? "&" : "#";
            window.location.hash += `${prefix}gui=${JSON.stringify(DATA)}`;
          }
        }, 100);

        if(type === "color") {
          onChange(colorFromHex(object[key], input.value));
        }

        reloadWindow();
      });
    }

    onChange(object[key]);

    this._inputs.push(input);

    return input;
  }
}

window.customElements.define("dlib-gui", GUI);
