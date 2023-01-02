export class TrackballTransform {
  constructor({
    matrix,
    domElement,
    inverted,
    rotationVelocity,
    rotationEaseRatio,
    distance,
    distanceMin,
    distanceMax,
    zoomEaseRatio,
    zoomVelocity,
    zoomDisabled,
    disabled,
  }?: {
    matrix?: Matrix4
    domElement?: HTMLElement
    inverted?: boolean
    rotationVelocity?: number
    rotationEaseRatio?: number
    distance?: number
    distanceMin?: number
    distanceMax?: number
    zoomEaseRatio?: number
    zoomVelocity?: number
    zoomDisabled?: boolean
    disabled?: boolean
  })
  matrix: Matrix4
  inverted: boolean
  rotationVelocity: number
  rotationEaseRatio: number
  distanceMax: number
  distanceMin: number
  zoomVelocity: number
  zoomEaseRatio: number
  zoomDisabled: boolean
  set distance(arg: number)
  get distance(): number
  disabled: boolean
  get distanceEased(): number
  update(): void
  #private
}
import { Matrix4 } from '@damienmortini/math'
