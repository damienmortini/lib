declare const _default: Ticker;
export default _default;
declare class Ticker extends Signal {
    static "__#1@#BASE_DELTA_TIME": number;
    constructor();
    add(value: any): Ticker;
    delete(value: any): boolean;
    deltaTime: number;
    smoothDeltatime: number;
    timeScale: number;
    smoothTimeScale: number;
    #private;
}
import { Signal } from "@damienmortini/signal";
