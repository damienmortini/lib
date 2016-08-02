import ControlKit from "controlkit";

// STYLES

let style = document.createElement("style");
document.head.appendChild(style);

style.sheet.insertRule(`
  #controlKit .panel .group-list .group .sub-group-list .sub-group .wrap .label {
    width: 50% !important;
  }
`, 0);

style.sheet.insertRule(`
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

function normalizeString(string) {
  return `${string.toLowerCase().replace(/[^\w-]/g, "")}`;
}

// GUI

let positionOffset = 0;
const COMPONENT_METHOD_NAMES = new Map([
  ["boolean", "addCheckbox"],
  ["string", "addStringInput"]
]);
const CONTAINERS = new Map();
const OBJECTS_DATA = new Map();

class GUI {
  constructor() {
    this._controlKit = new ControlKit();
  }

  add(object, key, {type = typeof object[key], label = key, panel = "", group = "", subGroup = "", reload = false, options}) {
    let internalKey = normalizeString(label);

    OBJECTS_DATA.set(internalKey, {
      object,
      key,
      reload
    });

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

    let panelKey = normalizeString(panel);
    let groupKey = normalizeString(group);
    let subGroupKey = normalizeString(subGroup);

    let containerKey = panelKey + "_" + groupKey + "_" + subGroupKey;


    let container = CONTAINERS.get(containerKey);

    if(!container) {
      let parent;
      containerKey = panelKey;
      container = CONTAINERS.get(containerKey);
      if(!container) {
        container = this._controlKit.addPanel({
          fixed: false,
          label: panel,
          width: 200,
          align: "left",
          position: [positionOffset, 0]
        });
        positionOffset += 200;
        CONTAINERS.set(containerKey, container);
      }

      parent = container;
      containerKey += "_" + groupKey;
      container = CONTAINERS.get(containerKey);
      if(!container) {
        container = parent.addGroup({
          label: group
        });
        CONTAINERS.set(containerKey, container);
      }

      parent = container;
      containerKey += "_" + subGroupKey;
      container = CONTAINERS.get(containerKey);
      if(!container) {
        container = parent.addSubGroup({
          label: subGroup
        });
        CONTAINERS.set(containerKey, container);
      }
    }

    let onChange = (value = object[key]) => {
      this._changeValue(internalKey, value, type);
    }

    switch (type) {
      case "color":
        let color = {
          value: `#${value}`
        };
        container.addColor(color, "value", {
          onChange,
          label,
          colorMode: "hex"
        });
        break;
      case "select":
        let obj = {
          options,
          selection: value || options[0]
        };
        container.addSelect(obj, "options", {
          onChange: function(index) {
            onChange(options[index]);
          },
          label
        });
        break;
      default:
        container[COMPONENT_METHOD_NAMES.get(type)](object, key, {
          onChange,
          label
        });
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
