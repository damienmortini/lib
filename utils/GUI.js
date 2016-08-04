import ControlKit from "controlkit";

// STYLES

let style = document.createElement("style");
document.head.appendChild(style);

style.sheet.insertRule(`
  #controlKit .panel .group-list .group .sub-group-list .sub-group .wrap .label {
    width: 40% !important;
  }
`, 0);

style.sheet.insertRule(`
  #controlKit .panel .group-list .group .sub-group-list .sub-group .wrap .wrap {
    width: 60% !important;
  }
`, 0);

style.sheet.insertRule(`
  #controlKit .panel .wrap-slider {
    width: 60% !important;
  }
`, 0);

style.sheet.insertRule(`
  #controlKit .options ul {
    max-height: 300px !important;
    overflow-y: scroll !important;
    overflow-x: hidden !important;
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
  return new RegExp(`([#&]gui-${key}=)([^=&#?]*)`, "g");
}

// GUI

let positionOffset = 0;
const CONTAINERS = new Map();

class GUI {
  constructor() {
    this._controlKit = new ControlKit();
  }

  add(object, key, {type = typeof object[key], label = key, panel = "", group = "", subGroup = "", reload = false, options, range, onChange} = {}) {
    let internalKey = normalizeString(label);

    let panelKey = normalizeString(panel);
    let groupKey = normalizeString(group);
    let subGroupKey = normalizeString(subGroup);

    let containerKey = panelKey + "_" + groupKey + "_" + subGroupKey;
    let container = CONTAINERS.get(containerKey);

    if (!container) {
      let parent;
      containerKey = panelKey;
      container = CONTAINERS.get(containerKey);
      if (!container) {
        container = this._controlKit.addPanel({
          fixed: false,
          label: panel,
          width: 240,
          align: "left",
          position: [positionOffset, 0]
        });
        positionOffset += 240;
        CONTAINERS.set(containerKey, container);
      }

      parent = container;
      containerKey += "_" + groupKey;
      container = CONTAINERS.get(containerKey);
      if (!container) {
        container = parent.addGroup({
          label: group
        });
        CONTAINERS.set(containerKey, container);
      }

      parent = container;
      containerKey += "_" + subGroupKey;
      container = CONTAINERS.get(containerKey);
      if (!container) {
        container = parent.addSubGroup({
          label: subGroup
        });
        CONTAINERS.set(containerKey, container);
      }
    }

    let changeValue = (value = object[key]) => {
      this._changeURLValue(internalKey, value);

      if(onChange) {
        onChange(object[key]);
      }

      if (reload) {
        window.location.reload();
      }
    }

    let regExp = urlHashRegExpFromKey(internalKey);
    let matches = regExp.exec(window.location.hash);

    switch (type) {
      case "boolean":
        object[key] = matches ? JSON.parse(matches[2]) : object[key];
        container.addCheckbox(object, key, {
          onChange: changeValue,
          label
        });
        break;
      case "number":
        object[key] = matches ? JSON.parse(matches[2]) : object[key];
        container.addNumberInput(object, key, {
          onChange: changeValue,
          label
        });
        break;
      case "color":
        let color = {};
        if(matches) {
          color.value = `#${matches[2]}`;
          colorFromHex(object[key], color.value);
        } else {
          color.value = colorToHex(object[key]);
        }
        container.addColor(color, "value", {
          onChange: function(value) {
            colorFromHex(object[key], value);
            changeValue(value.replace("#", ""));
          },
          label,
          colorMode: "hex"
        });
        break;
      case "select":
        object[key] = matches ? matches[2] : object[key];
        container.addSelect({
          options,
          selection: object[key]
        }, "options", {
          onChange: function(index) {
            object[key] = options[index];
            changeValue(object[key]);
          },
          label
        });
        break;
      case "slider":
        object[key] = matches ? JSON.parse(matches[2]) : object[key];
        let slider = {
          value: object[key],
          range: range || [0, 1]
        };
        container.addSlider(slider, "value", "range", {
          onChange: function(value) {
            object[key] = slider.value;
            changeValue(slider.value);
          },
          label
        });
        break;
      case "xy":
        let xy = {};
        if(object[key].x !== undefined) {
          if(matches) {
            xy.value = JSON.parse(matches[2]);
            [object[key].x, object[key].y] = [xy.value[0], xy.value[1]];
          } else {
            xy.value = [object[key].x, object[key].y];
          }
        } else {
          object[key] = matches ? JSON.parse(matches[2]) : object[key];
          xy.value = object[key];
        }
        container.addPad(xy, "value", {
          onChange: function() {
            if(object[key].x) {
              [object[key].x, object[key].y] = [xy.value[0], xy.value[1]];
            }
            changeValue(JSON.stringify(xy.value));
          },
          label
        });
        break;
    }

    if(onChange) {
      onChange(object[key]);
    }

    return object[key];
  }

  _changeURLValue(key, value) {
    let regExp = urlHashRegExpFromKey(key);
    let matches = regExp.exec(window.location.hash);
    if (!matches) {
      let prefix = window.location.hash ? "&" : "#";
      window.location.hash += `${prefix}gui-${key}=${value}`;
    } else {
      window.location.hash = window.location.hash.replace(matches[0], matches[0].replace(regExp, `$1${value}`));
    }
  }
}

export default new GUI();
