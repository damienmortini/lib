let ghostElement;

export default class Color {
  static styleToRGBA(value) {
    if(!ghostElement) {
      ghostElement = document.createElement("span");
      ghostElement.id = "dlib-color-ghost-element";
      document.head.appendChild(ghostElement);
    }
  
    ghostElement.style.color = value;

    const results = /rgba?\s*\(\s*(\d*),\s*(\d*)\s*,\s*(\d*)\s*(,\s*([\.\d]*))?\s*\)/.exec(getComputedStyle(ghostElement).getPropertyValue("color"));
    return results ? [
      parseInt(results[1]) / 255,
      parseInt(results[2]) / 255,
      parseInt(results[3]) / 255,
      results[5] !== undefined ? parseFloat(results[5]) : 1
     ] : null;
  }

  static hexToRGB(hex) {
    var results = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return results ? [
      parseInt(results[1], 16) / 255,
      parseInt(results[2], 16) / 255,
      parseInt(results[3], 16) / 255
     ] : null;
  }
}