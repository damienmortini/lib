export class Signal extends Set<any> {
  constructor(values?: readonly any[]);
  constructor(iterable?: Iterable<any>);
  dispatch(value: any): void;
}
