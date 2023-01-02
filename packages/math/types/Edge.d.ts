export default class Edge {
    constructor(a?: Vector2, b?: Vector2);
    a: Vector2;
    b: Vector2;
    get angle(): number;
    getCenter(): Vector2;
    getPointFromRatio(ratio: any): Vector2;
}
import Vector2 from "./Vector2";
