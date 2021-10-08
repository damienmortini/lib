let element

export const styleToRGBA = (value) => {
  if (!element) {
    element = document.createElement('br')
    element.style.display = 'none'
    document.body.appendChild(element)
  }
  element.style.color = value

  const results = /rgba?\s*\(\s*(\d*),\s*(\d*)\s*,\s*(\d*)\s*(,\s*([.\d]*))?\s*\)/.exec(getComputedStyle(element).getPropertyValue('color'))
  return results ? [
    parseInt(results[1]) / 255,
    parseInt(results[2]) / 255,
    parseInt(results[3]) / 255,
    results[5] !== undefined ? parseFloat(results[5]) : 1,
  ] : null
}

export const RGBToHSL = (rgb, output = []) => {
  const r = rgb[0]
  const g = rgb[1]
  const b = rgb[2]

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  let hue
  let saturation

  const lightness = (min + max) / 2.0

  if (min === max) {
    hue = 0
    saturation = 0
  } else {
    const delta = max - min
    saturation = lightness <= 0.5 ? delta / (max + min) : delta / (2 - max - min)
    switch (max) {
      case r: hue = (g - b) / delta + (g < b ? 6 : 0); break
      case g: hue = (b - r) / delta + 2; break
      case b: hue = (r - g) / delta + 4; break
    }
    hue /= 6
  }

  output[0] = hue
  output[1] = saturation
  output[2] = lightness

  return output
}

export const hexToRGB = (hex) => {
  const results = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return results ? [
    parseInt(results[1], 16) / 255,
    parseInt(results[2], 16) / 255,
    parseInt(results[3], 16) / 255,
  ] : null
}

export const rgbToHex = (rgb) => {
  let hex = '#'
  for (const component of rgb) {
    const componentString = Math.floor(component * 255).toString(16)
    hex += componentString.length == 1 ? '0' + componentString : componentString
  }
  return hex
}
