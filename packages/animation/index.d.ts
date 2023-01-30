export function animate(
  target: any,
  keyframes: any,
  {
    duration,
    delay,
    easing,
    onupdate,
    fill,
  }?: {
    duration?: number
    delay?: number
    easing?: (x: any) => any
    onupdate?: () => void
    fill?: string
  },
): {
  finished: Promise<any>
  cancel: () => void
}
