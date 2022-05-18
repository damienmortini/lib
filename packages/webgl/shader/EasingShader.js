export const powerIn = () => {
  return `float powerIn(float x, float power) {
  return pow(x, power);
}
`
}

export const powerOut = () => {
  return `float powerOut(float x, float power) {
  return 1. - pow(1. - x, power);
}
`
}

export const powerInOut = () => {
  return `float powerInOut(float x, float power) {
  return x < .5 ? pow(x * 2., power) / 2. : (1. - pow(1. - (x * 2. - 1.), power)) / 2. + 0.5;
}
`
}
