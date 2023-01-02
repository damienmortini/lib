export default class Ray {
    origin: Vector3;
    direction: Vector3;
    setFromCamera(camera: any, position?: number[]): Ray;
}
import Vector3 from "./Vector3.js";
