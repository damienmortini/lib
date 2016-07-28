import ControlKit from "controlkit";

// STYLES

document.styleSheets[0].insertRule(`
  #controlKit .panel .group-list .group .sub-group-list .sub-group .wrap .label {
    width: 50% !important;
  }
`, 0);

document.styleSheets[0].insertRule(`
  #controlKit .panel .group-list .group .sub-group-list .sub-group .wrap .wrap {
    width: 50% !important;
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

// GUI

const CONTROLKIT_PANELS = new Map();
const OBJECTS_DATA = new Map();
const PROPERTIES = new Map();

(function() {
  const regExp = /[#&]([\w_-]+)=?([\w_-]*)/g;

  let matches;
  while (matches = regExp.exec(window.location.hash)) {
    PROPERTIES.set(matches[1].replace("gui-", ""), matches[2]);
  }
})();

class GUI {
  constructor() {
    this._controlKit = new ControlKit();
  }

  add(object, key, {type = typeof object[key], label = key, panel = "Main"}) {
    let internalKey = `${label.toLowerCase().replace(/[^\w-]/g, "")}`;

    OBJECTS_DATA.set(internalKey, {
      object,
      key
    });

    let value = PROPERTIES.get(internalKey);
    if(!value) {
      if(type === "color") {
        let color = object[key];
        value = rgbToHex(
          color.r !== undefined ? color.r : color.x !== undefined ? color.x : color[0],
          color.g !== undefined ? color.g : color.y !== undefined ? color.y : color[1],
          color.b !== undefined ? color.b : color.z !== undefined ? color.z : color[2]
        ).replace("#", "");
      } else {
        value = object[key];
      }
    }

    let controlkitPanel = CONTROLKIT_PANELS.get(panel);

    if(!controlkitPanel) {
      controlkitPanel = this._controlKit.addPanel({
        fixed: false,
        label: panel,
        width: 200
      });
      CONTROLKIT_PANELS.set(panel, controlkitPanel);
    }

    let onChange = (value) => {
      this._updateValue(internalKey, value, type);
    }

    switch (type) {
      case "color":
        let color = {
          value: `#${value}`
        };
        controlkitPanel.addColor(color, "value", {
          onChange,
          label,
          colorMode: "hex"
        });
        break;
    }

    onChange(value);
  }

  _updateValue(key, value, type) {
    let regExp = new RegExp(`([#&]gui-${key}=?)([\\w_-]*)`, "g");

    let matches = regExp.exec(window.location.hash);

    if(!matches) {
      let prefix = window.location.hash ? "&" : "#";
      window.location.hash += `${prefix}gui-${key}=${value}`;
    } else {

      let objectData = OBJECTS_DATA.get(key);

      if(type === "color") {
        let color = objectData.object[objectData.key];
        let colorValue = hexToRgb(value);

        if(color.r !== undefined) {
          Object.assign(color, colorValue);
        } else if (color.x !== undefined) {
          [color.x, color.y, color.z] = [colorValue.r, colorValue.g, colorValue.b];
        } else {
          [color[0], color[1], color[2]] = [colorValue.r, colorValue.g, colorValue.b];
        }

        value = value.replace("#", "");
      } else {
        objectData.object[objectData.key] = value;
      }

      window.location.hash = window.location.hash.replace(matches[0], matches[0].replace(regExp, `$1${value}`));
    }

    PROPERTIES.set(key, value);
  }
}

export default new GUI();
