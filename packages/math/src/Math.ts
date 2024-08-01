export function modulo(x, y) {
  return ((x % y) + y) % y;
}

export function threshold(from, to, value) {
  return Math.max(0, Math.min(1, (value - from) / (to - from))) || 0;
}

export function smoothstep(from, to, value) {
  const t = threshold(from, to, value);
  return t * t * (3.0 - 2.0 * t);
}
