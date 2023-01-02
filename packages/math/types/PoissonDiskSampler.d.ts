export default class PoissonDiskSampler {
    static fill({ x, y, z, width, height, depth, radius, steps, points, }: {
        x?: number;
        y?: number;
        z?: number;
        width: any;
        height: any;
        depth?: number;
        radius: any;
        steps?: number;
        points?: any[];
    }): Vector3[];
}
import Vector3 from "./Vector3.js";
