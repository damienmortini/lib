export type RouteMatchCallback = (matches?: RegExpExecArray) => unknown;

export class Router extends EventTarget {
  routes: Map<RegExp, RouteMatchCallback>;

  constructor({ routes }: { routes: Map<RegExp, RouteMatchCallback> }) {
    super();
    this.routes = routes;
  }

  getStates(path: string) {
    const entries = [];

    for (const [regexp, callback] of this.routes) {
      const matches = regexp.exec(path);
      if (matches) {
        entries.push(callback(matches));
      }
    }

    return entries;
  }
}
