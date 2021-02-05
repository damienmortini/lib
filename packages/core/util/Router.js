import Signal from './Signal.js';

export class Router {
  constructor() {
    this._stateChangeSignal = new Signal();
    this._pathname = window.location.pathname;
  }

  get stateChangeSignal() {
    return this._stateChangeSignal;
  }

  get pathname() {
    return this._pathname;
  }

  set pathname(value) {
    if (this._pathname === value) return;
    this._pathname = value;
    history.pushState({ pathname: this._pathname }, '', this._pathname || '/');
    this._stateChangeSignal.dispatch({ pathname: this._pathname });
  }
}

export default new Router();
