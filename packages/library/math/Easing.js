export const powerIn = (x, power = 2) => {
  return Math.pow(x, power)
}

export const powerOut = (x, power = 2) => {
  return 1 - Math.abs(Math.pow(x - 1, power))
}

export const powerInOut = (x, power = 2) => {
  return x < .5 ? powerIn(x * 2, power) / 2 : powerOut(x * 2 - 1, power) / 2 + 0.5
}

export const backIn = (x, power = 1.7) => {
  return (1 + power) * x * x * x - power * x * x
}

export const backOut = (x, power = 1.7) => {
  return 1 + (1 + power) * Math.pow(x - 1, 3) + power * Math.pow(x - 1, 2)
}

export const backInOut = (x, power = 1.7) => {
  return x < .5 ? backIn(x * 2, power) / 2 : backOut(x * 2 - 1, power) / 2 + 0.5
}
