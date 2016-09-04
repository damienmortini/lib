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
  return new RegExp(`([#&]gui/${key}=)([^=&#?]*)`, "g");
}

const COMPONENTS = [];

// GUI

const GUI_REG_EXP = /([#&]gui=)({.*})([&?]*)/;

let DATA;
(function() {
  let matches = GUI_REG_EXP.exec(window.location.hash);
  DATA = matches ? JSON.parse(matches[2]) : {};
})();

const CONTROL_KIT_CONTAINERS = new Map();

let positionOffset = 0;

class GUIComponent {
  constructor(object, key, type, controlKitComponent) {
    this._type = type;
    this._object = object;
    this._key = key;
    this._controlKitComponent = controlKitComponent;
  }
  get object() {
    return this._object;
  }
  get key() {
    return this._key;
  }
  get value() {
    return this.object[this.key];
  }
  get type() {
    return this._type;
  }
  get controlKitComponent() {
    return this._controlKitComponent;
  }
  remove() {
    this.controlKitComponent.disable();
    this.controlKitComponent._node._element.remove();
  }
}

class GUI {
  constructor() {
    this._controlKit = new ControlKit();
  }

  update() {
    for (let component of COMPONENTS) {
      switch (component.type) {
        case "color":
          component.controlKitComponent._obj._value = component.controlKitComponent._value = colorToHex(component.object[component.key]);
          component.controlKitComponent._updateColor();
          break;
      }
    }

    requestAnimationFrame(() => {
      this._controlKit.update();
    });
  }

  open(panel, group) {
    CONTROL_KIT_CONTAINERS.get(normalizeString(panel) + (group ? "/" + normalizeString(group) : "")).enable();
  }

  close(panel, group) {
    CONTROL_KIT_CONTAINERS.get(normalizeString(panel) + (group ? "/" + normalizeString(group) : "")).disable();
  }

  add(object, key, {type = typeof object[key], label = key, panel = "Main", group = "", reload = false, options, range, onChange} = {}) {
    let labelKey = normalizeString(label);

    let panelKey = normalizeString(panel);
    let controlKitPanel = CONTROL_KIT_CONTAINERS.get(panelKey);
    if(!controlKitPanel) {
      controlKitPanel = this._controlKit.addPanel({
        fixed: false,
        label: panel,
        width: 240,
        align: "left",
        position: [positionOffset, 0]
      });
      CONTROL_KIT_CONTAINERS.set(panelKey, controlKitPanel);
      positionOffset += 240;
    }

    let groupKey = normalizeString(group);
    let controlKitGroup = CONTROL_KIT_CONTAINERS.get(`${panelKey}/`);
    if(groupKey) {
      controlKitGroup = CONTROL_KIT_CONTAINERS.get(`${panelKey}/${groupKey}`);
      if(!controlKitGroup) {
        controlKitPanel.addGroup({
          label: group
        });
        controlKitGroup = controlKitPanel._groups[controlKitPanel._groups.length - 1];
        CONTROL_KIT_CONTAINERS.set(`${panelKey}/${groupKey}`, controlKitGroup);
      }
    }

    if(controlKitGroup) {
      controlKitPanel._groups.push(controlKitPanel._groups.splice(controlKitPanel._groups.indexOf(controlKitGroup), 1)[0]);
    }

    let savedValue;

    if (groupKey && DATA[panelKey] && DATA[panelKey][groupKey]) {
      savedValue = DATA[panelKey][groupKey][labelKey];
    } else if (DATA[panelKey]) {
      savedValue = DATA[panelKey][labelKey];
    }

    let changeValueData = (value = object[key]) => {
      let containerData = DATA[panelKey];
      if(!containerData) {
        containerData = DATA[panelKey] = {};
      }
      if(group) {
        let groupData = containerData[groupKey];
        if(!groupData) {
          groupData = {};
          containerData[groupKey] = groupData;
        }
        containerData = groupData;
      }

      containerData[labelKey] = value;

      if(GUI_REG_EXP.test(window.location.hash)) {
        window.location.hash = window.location.hash.replace(GUI_REG_EXP, `$1${JSON.stringify(DATA)}$3`);
      } else {
        let prefix = window.location.hash ? "&" : "#";
        window.location.hash += `${prefix}gui=${JSON.stringify(DATA)}`;
      }

      if(onChange) {
        onChange(object[key]);
      }

      if (reload) {
        window.location.reload();
      }
    }

    switch (type) {
      case "boolean":
        object[key] = savedValue === undefined ?  object[key] : savedValue;
        controlKitPanel.addCheckbox(object, key, {
          onChange: changeValueData,
          label
        });
        break;
      case "number":
        object[key] = savedValue === undefined ?  object[key] : savedValue;
        controlKitPanel.addNumberInput(object, key, {
          onChange: changeValueData,
          label
        });
        break;
      case "string":
        object[key] = savedValue === undefined ?  object[key] : savedValue;
        controlKitPanel.addStringInput(object, key, {
          onChange: changeValueData,
          label
        });
        break;
      case "color":
        let color = {};
        if(savedValue !== undefined) {
          color.value = `#${savedValue}`;
          colorFromHex(object[key], color.value);
        } else {
          color.value = colorToHex(object[key]);
        }
        controlKitPanel.addColor(color, "value", {
          onChange: function(value) {
            colorFromHex(object[key], value);
            changeValueData(value.replace("#", ""));
          },
          label,
          colorMode: "hex"
        });
        break;
      case "select":
        object[key] = savedValue === undefined ?  object[key] : savedValue;
        controlKitPanel.addSelect({
          options,
          selection: object[key]
        }, "options", {
          onChange: function(index) {
            object[key] = options[index];
            changeValueData(object[key]);
          },
          label
        });
        break;
      case "slider":
        object[key] = savedValue === undefined ?  object[key] : savedValue;
        let slider = {
          value: object[key],
          range: range || [0, 1]
        };
        controlKitPanel.addSlider(slider, "value", "range", {
          onChange: function(value) {
            object[key] = slider.value;
            changeValueData(slider.value);
          },
          label
        });
        break;
      case "xy":
        let xy = {};
        if(object[key].x !== undefined) {
          if(matches) {
            xy.value = savedValue;
            [object[key].x, object[key].y] = [xy.value[0], xy.value[1]];
          } else {
            xy.value = [object[key].x, object[key].y];
          }
        } else {
          object[key] = savedValue === undefined ?  object[key] : savedValue;
          xy.value = object[key];
        }
        controlKitPanel.addPad(xy, "value", {
          onChange: function() {
            if(object[key].x) {
              [object[key].x, object[key].y] = [xy.value[0], xy.value[1]];
            }
            changeValueData(xy.value);
          },
          label
        });
        break;
    }

    if(!CONTROL_KIT_CONTAINERS.get(`${panelKey}/`)) {
      CONTROL_KIT_CONTAINERS.set(`${panelKey}/`, controlKitPanel._groups[0]);
    }

    if(onChange) {
      onChange(object[key]);
    }

    if(!controlKitGroup) {
      controlKitGroup = controlKitPanel._groups[controlKitPanel._groups.length - 1];
    }
    let controlKitComponent = controlKitGroup._components[controlKitGroup._components.length - 1];

    let component = new GUIComponent(object, key, type, controlKitComponent);
    COMPONENTS.push(component)
    return component;
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
