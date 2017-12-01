export default class YouTubeAPI {
  static load() {
    return new Promise((resolve) => {
      if(document.querySelector(`script[src$="//www.youtube.com/iframe_api"]`)) {
        resolve();
      }
    
      window.onYouTubeIframeAPIReady = () => {
        resolve();
      }
    
      let script = document.createElement("script");
      script.src = "//www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });;
  }
}