export type RouteMatchCallback<State = unknown> = (matches?: RegExpExecArray) => State;

export class Router<State = unknown> {
  routes: Map<RegExp, RouteMatchCallback<State>>;

  constructor({ routes }: { routes: Map<RegExp, RouteMatchCallback<State>> }) {
    this.routes = routes;
  }

  getStates(path: string): State[] {
    const entries: State[] = [];

    for (const [regexp, callback] of this.routes) {
      // Global/sticky regexps keep lastIndex between calls and would skip matches
      if (regexp.global || regexp.sticky) regexp.lastIndex = 0;
      const matches = regexp.exec(path);
      if (matches) {
        entries.push(callback(matches));
      }
    }

    return entries;
  }
}
