/**
 * Shims for browser APIs that jsdom does not implement, for `node --test`
 * setups.
 */

/**
 * The DOM every element suite needs on `globalThis`, whatever it renders. The
 * interfaces only some of them touch go in the `extraGlobalNames` the calling
 * package passes to {@link installDomGlobals}.
 */
const BASE_GLOBAL_NAMES: readonly string[] = [
  'window', 'document', 'navigator', 'location', 'history', 'customElements',
  'Node', 'Element', 'DocumentFragment', 'ShadowRoot',
  'HTMLElement', 'HTMLDivElement', 'HTMLButtonElement', 'HTMLInputElement',
  'SVGElement', 'SVGSVGElement',
  'CSSStyleSheet', 'MutationObserver', 'ResizeObserver', 'matchMedia',
  'localStorage', 'sessionStorage',
  'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'PointerEvent',
  'AbortController', 'AbortSignal',
  'requestAnimationFrame', 'cancelAnimationFrame',
];

interface DomGlobalsWindow {
  navigator: Navigator;
  [name: string]: unknown;
}

function define(target: object, name: string, value: unknown): void {
  Object.defineProperty(target, name, { value, writable: true, configurable: true });
}

/**
 * Puts a jsdom window's DOM on `globalThis`, so element source that reaches
 * for `document` or `HTMLElement` finds them under `node --test`.
 *
 * Every name is copied over whatever Node.js already has under that name,
 * never beside it. Node ships identically-named globals (`Event`,
 * `CustomEvent`, `AbortController`, `navigator`), and jsdom instanceof-checks
 * values passed across its API boundary against its own internal constructors
 * — so Node's built-ins fail with errors like "parameter 1 is not of type
 * Event" (dispatchEvent).
 *
 * The inert stubs below fill APIs jsdom implements nowhere, and go on the
 * window first so the copy picks them up.
 */
export function installDomGlobals(window: DomGlobalsWindow, extraGlobalNames: readonly string[] = []): void {
  if (!('clipboard' in window.navigator)) {
    define(window.navigator, 'clipboard', { writeText: async (): Promise<void> => {} });
  }
  window.matchMedia ??= (media: string) => ({
    matches: false,
    media,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
  window.ResizeObserver ??= class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };

  for (const name of [...BASE_GLOBAL_NAMES, ...extraGlobalNames]) {
    if (name in window) define(globalThis, name, window[name]);
  }
}

interface PointerCaptureWindow {
  Element: { prototype: Element };
}

/**
 * jsdom implements no pointer capture at all, so the two methods a drag
 * reaches for are supplied as no-ops.
 *
 * What they cannot supply is the retargeting capture is *chosen* for: after a
 * real `setPointerCapture` every later event for that pointer is delivered to
 * the capturing element, however far outside it the pointer has travelled.
 * Nothing is retargeted here, so a suite has to dispatch the rest of a drag at
 * the element the source captured on — which is where the source listens, so
 * what the test drives is still the real handler.
 */
export function installPointerCaptureShim(window: PointerCaptureWindow): void {
  // Skip a jsdom that has grown a real implementation — its retargeting is
  // strictly more than these no-ops can be.
  if (typeof window.Element.prototype.setPointerCapture === 'function') return;
  define(window.Element.prototype, 'setPointerCapture', function setPointerCapture(): void {});
  define(window.Element.prototype, 'releasePointerCapture', function releasePointerCapture(): void {});
}
