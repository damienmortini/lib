export const VERTEX = `#version 300 es
void main() {
  gl_Position = vec4(0., 0., 0., 1.);
}`

export const FRAGMENT = `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.);
}`

export const addChunks = ({ shader = 'void main() {}', chunks }) => {
  for (const [key, chunk] of chunks) {
    switch (key) {
      case 'start':
        shader = shader.replace(/^(#version .*?\n(\s*precision highp float;\s)?)?([\s\S]*)/, `$1\n${chunk}\n$3`)
        break
      case 'end':
        shader = shader.replace(/(}\s*$)/, `\n${chunk}\n$1`)
        break
      case 'main':
        shader = shader.replace(/(\bvoid\b +\bmain\b[\s\S]*?{\s*)/, `$1\n${chunk}\n`)
        break
      default:
        shader = shader.replace(key, chunk)
    }
  }
  return shader
}

export const getUniformData = (shader) => {
  const uniformData = new Map()

  const structures = new Map()

  const structRegExp = /struct\s*(.*)\s*{\s*([\s\S]*?)}/g
  const structMemberRegExp = /^\s*(?:highp|mediump|lowp)?\s*(.[^ ]+) (.[^ ;[\]]+)\[? *(\d+)? *\]?/gm
  for (const [, structName, structString] of shader.matchAll(structRegExp)) {
    const structure = {}
    for (const [, type, name, arrayLengthStr] of structString.matchAll(structMemberRegExp)) {
      const arrayLength = parseInt(arrayLengthStr)
      structure[name] = {
        type,
        ...(arrayLength ? { arrayLength } : {}),
      }
    }

    structures.set(structName, structure)
  }

  const uniformsRegExp = /^\s*uniform (?:highp|mediump|lowp)? *(.[^ ]+) (.[^ ;[\]]+)\[? *(\d+)? *\]?/gm
  for (const [, type, name, arrayLengthStr] of shader.matchAll(uniformsRegExp)) {
    const data = {
      type,
      ...(arrayLengthStr ? { arrayLength: parseInt(arrayLengthStr) } : {}),
    }
    uniformData.set(name, data)
  }

  return uniformData
}
