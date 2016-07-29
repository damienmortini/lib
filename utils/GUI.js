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

function colorFromHex(color, hex) {
  let colorValue = hexToRgb(hex);

  if(color.r !== undefined) {
    Object.assign(color, colorValue);
  } else if (color.x !== undefined) {
    [color.x, color.y, color.z] = [colorValue.r, colorValue.g, colorValue.b];
  } else {
    [color[0], color[1], color[2]] = [colorValue.r, colorValue.g, colorValue.b];
  }

  return color;
}

function colorToHex(color) {
  return rgbToHex(
    color.r !== undefined ? color.r : color.x !== undefined ? color.x : color[0],
    color.g !== undefined ? color.g : color.y !== undefined ? color.y : color[1],
    color.b !== undefined ? color.b : color.z !== undefined ? color.z : color[2]
  ).replace("#", "");
}

// GUI

const CONTROLKIT_PANELS = new Map();
const OBJECTS_DATA = new Map();

class GUI {
  constructor() {
    this._controlKit = new ControlKit();
  }

  add(object, key, {type = typeof object[key], label = key, panel = "Main", reload = false}) {
    let internalKey = `${label.toLowerCase().replace(/[^\w-]/g, "")}`;

    OBJECTS_DATA.set(internalKey, {
      object,
      key,
      reload
    });



    // Test if property is in URL

    // const regExp = /[#&]([\w_-]+)=?([\w_-]*)/g;
    // let matches;
    // while (matches = regExp.exec(window.location.hash)) {
    //   let value = matches[2];
    //   try {
    //     let newValue = JSON.parse(value);
    //     value = newValue !== Infinity ? newValue : value;
    //   } catch (e) {}
    // }

    let value;

    let regExp = new RegExp(`[#&]gui-${internalKey}=?([\\w_-]*)`, "g");
    let matches = regExp.exec(window.location.hash);

    if(matches) {
      switch (type) {
        case "boolean":
          value = matches[1] === "true";
          break;
        case "number":
          value = parseFloat(matches[1]);
          break
        default:
          value = matches[1];
      }
      if(type === "color") {
        colorFromHex(object[key], value);
      } else {
        object[key] = value;
      }
    }
    else {
      value = type === "color" ? colorToHex(object[key]) : object[key];
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

    let onChange = (value = object[key]) => {
      this._changeValue(internalKey, value, type);
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
      case "boolean":
        controlkitPanel.addCheckbox(object, key, {
          onChange,
          label
        });
        break;
    }

    return object[key];
  }

  _changeValue(key, value, type) {
    let objectData = OBJECTS_DATA.get(key);

    if(type === "color") {
      colorFromHex(objectData.object[objectData.key], value);
      value = value.replace("#", "");
    } else {
      objectData.object[objectData.key] = value;
    }

    let regExp = new RegExp(`([#&]gui-${key}=?)([\\w_-]*)`, "g");
    let matches = regExp.exec(window.location.hash);

    if(!matches) {
      let prefix = window.location.hash ? "&" : "#";
      window.location.hash += `${prefix}gui-${key}=${value}`;
    } else {
      window.location.hash = window.location.hash.replace(matches[0], matches[0].replace(regExp, `$1${value}`));
    }

    if(objectData.reload) {
      window.location.reload();
    }
  }
}

export default new GUI();
