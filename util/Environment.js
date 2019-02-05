import "../../mobile-detect/mobile-detect.min.js";

const MOBILE_DETECT = new window.MobileDetect(window.navigator.userAgent);

const mobile = !!MOBILE_DETECT.mobile() || /\bmobile\b/.test(window.location.search);
const os = MOBILE_DETECT.os();

export default class Environment {
  static get mobile() {
    return mobile;
  }

  static get os() {
    return os;
  }
}
