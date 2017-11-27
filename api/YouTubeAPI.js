const PROMISE = new Promise((resolve) => {
  if(document.querySelector(`script[src$="//www.youtube.com/iframe_api"]`)) {
    resolve();
  }

  window.onYouTubeIframeAPIReady = () => {
    resolve();
  }

  let script = document.createElement("script");
  script.src = "//www.youtube.com/iframe_api";
  document.head.appendChild(script);
});

export default class YouTubeAPI {
  static get ready() {
    return PROMISE;
  }
}