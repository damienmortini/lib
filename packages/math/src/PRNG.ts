import { modulo } from './Math.js'

export function random(x) {
  return modulo(Math.sin(x) * 43758.5453123, 1)
}
