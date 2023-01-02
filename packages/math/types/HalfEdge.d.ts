export default class HalfEdge extends TwinEdge {
    constructor(a: any, b: any);
    twin: TwinEdge;
    reset(): HalfEdge;
}
declare class TwinEdge extends Edge {
    next: any;
    twin: any;
}
import Edge from "./Edge.js";
export {};
