export class OrbitTransform {
  constructor({
    matrix,
    domElement,
    pan,
    tilt,
    inverted,
    distance,
    distanceMin,
    distanceMax,
    tiltMin,
    tiltMax,
    tiltDisabled,
    panMin,
    panMax,
    panDisabled,
    rotationEasing,
    rotationVelocity,
    zoomEasing,
    zoomVelocity,
    zoomDisabled,
  }: {
    matrix?: Matrix4
    domElement?: Window | HTMLElement
    pan?: number
    tilt?: number
    inverted?: boolean
    distance?: number
    distanceMin?: number
    distanceMax?: number
    tiltMin?: number
    tiltMax?: number
    tiltDisabled?: boolean
    panMin?: number
    panMax?: number
    panDisabled?: boolean
    rotationEasing?: number
    rotationVelocity?: number
    zoomEasing?: number
    zoomVelocity?: number
    zoomDisabled?: boolean
  })
  matrix: Matrix4
  inverted: boolean
  distanceMax: number
  distanceMin: number
  zoomEasing: number
  tiltMax: number
  tiltMin: number
  tiltDisabled: boolean
  panMax: number
  panMin: number
  panDisabled: boolean
  rotationEasing: number
  rotationVelocity: number
  zoomDisabled: boolean
  zoomVelocity: number
  panEnd: number
  tiltEnd: number
  distanceEnd: number
  set pan(arg: number)
  get pan(): number
  set tilt(arg: number)
  get tilt(): number
  set distance(arg: number)
  get distance(): number
  update(): void
  #private
}
import { Matrix4 } from '@damienmortini/math'
