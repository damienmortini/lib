import MobileDetect from "mobile-detect/mobile-detect.min.js";

const MOBILE_DETECT = new MobileDetect(window.navigator.userAgent);

let mobile = !!MOBILE_DETECT.mobile() || /\bmobile\b/.test(window.location.search);

export default class Environment {
  static get mobile() {
    return mobile;
  }
}
