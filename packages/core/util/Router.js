import Signal from './Signal.js';

export class Router {
  constructor() {
    this._routeChangeSignal = new Signal();
    this._currentPage = '';
  }

  get routeChangeSignal() {
    return this._routeChangeSignal;
  }

  get currentPage() {
    return this._currentPage;
  }

  set currentPage(value) {
    this._currentPage = value;
    history.pushState({ pageName: this._currentPage }, '', this._currentPage || '/');
    this._routeChangeSignal.dispatch({ pageName: this._currentPage });
  }
}

export default new Router();
