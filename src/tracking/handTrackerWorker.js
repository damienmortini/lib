this.onmessage = function(e) {
  postMessage(JSON.parse(e.data));
};
