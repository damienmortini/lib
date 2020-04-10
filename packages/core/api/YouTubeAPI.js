let PROMISE;

export default class YouTubeAPI {
  static load() {
    PROMISE = PROMISE || new Promise((resolve) => {
      window.onYouTubeIframeAPIReady = () => {
        resolve();
      };

      const script = document.createElement('script');
      script.src = '//www.youtube.com/iframe_api';
      document.head.appendChild(script);
    });
    return PROMISE;
  }
}
