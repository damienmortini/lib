let PROMISE;

export default class GoogleAPI {
  static load() {
    PROMISE = PROMISE || new Promise((resolve) => {
      const script = document.createElement('script');
      script.onload = resolve;
      script.src = '//apis.google.com/js/api.js';
      document.head.appendChild(script);
    });
    return PROMISE;
  }
}
