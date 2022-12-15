/**
 * Element triggering and managing a stable requestAnimationFrame loop.
 * @hideconstructor
 */
export class DamdomTickerElement extends HTMLElement {
    static get deltaTime(): any;
    connectedCallback(): void;
    disconnectedCallback(): void;
    /**
     * Play element.
     */
    play(): void;
    /**
     * Pause element.
     */
    pause(): void;
    /**
     * Tells whether the element is paused.
     * @type {Boolean}
     * @readonly
     */
    readonly get paused(): boolean;
    set callback(arg: any);
    #private;
}
