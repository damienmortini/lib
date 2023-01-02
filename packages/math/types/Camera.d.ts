export default class Camera {
    constructor({ near, far, aspectRatio, fov }?: {
        near?: number;
        far?: number;
        aspectRatio?: number;
        fov?: number;
    });
    transform: Matrix4;
    set near(arg: number);
    get near(): number;
    set far(arg: number);
    get far(): number;
    set fov(arg: number);
    get fov(): number;
    set aspectRatio(arg: number);
    get aspectRatio(): number;
    get inverseTransform(): Matrix4;
    get projection(): Matrix4;
    get projectionView(): Matrix4;
    #private;
}
import Matrix4 from "./Matrix4.js";
