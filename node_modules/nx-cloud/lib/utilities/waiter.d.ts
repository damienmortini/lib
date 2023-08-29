export declare function wait(time: number): Promise<unknown>;
export declare class Waiter {
    value: number;
    wait(): Promise<void>;
    reset(): void;
}
