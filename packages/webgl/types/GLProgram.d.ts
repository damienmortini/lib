export class GLProgram {
  constructor({ gl, uniforms, vertex, fragment, transformFeedbackVaryings }: {
    gl: any;
    uniforms?: {};
    vertex?: string;
    fragment?: string;
    transformFeedbackVaryings?: any;
  });
  gl: any;
  attributes: {
    set(name: any, { buffer, location, size, componentType, normalized, byteStride, byteOffset, divisor }?: {
      buffer?: any;
      location?: any;
      size?: number;
      componentType?: any;
      normalized?: boolean;
      byteStride?: number;
      byteOffset?: number;
      divisor?: number;
    }): void;
    clear(): void;
    delete(key: any): boolean;
    forEach(callbackfn: (value: any, key: any, map: Map<any, any>) => void, thisArg?: any): void;
    get(key: any): any;
    has(key: any): boolean;
    readonly size: number;
    entries(): IterableIterator<[any, any]>;
    keys(): IterableIterator<any>;
    values(): IterableIterator<any>;
    [Symbol.iterator](): IterableIterator<[any, any]>;
    readonly [Symbol.toStringTag]: string;
  };

  uniforms: {
    set(name: any, value: any): any;
    clear(): void;
    delete(key: any): boolean;
    forEach(callbackfn: (value: any, key: any, map: Map<any, any>) => void, thisArg?: any): void;
    get(key: any): any;
    has(key: any): boolean;
    readonly size: number;
    entries(): IterableIterator<[any, any]>;
    keys(): IterableIterator<any>;
    values(): IterableIterator<any>;
    [Symbol.iterator](): IterableIterator<[any, any]>;
    readonly [Symbol.toStringTag]: string;
  };

  set vertex(arg: string);
  get vertex(): string;
  set fragment(arg: string);
  get fragment(): string;
  get uniformData(): Map<any, any>;
  get textureUnits(): Map<any, any>;
  use(): void;
  #private;
}
