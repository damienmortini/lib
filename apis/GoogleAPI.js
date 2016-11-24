
(function(){
  if(document.querySelector(`script[src$="//apis.google.com/js/api.js"]`)) {
    return;
  }
  let script = document.createElement("script");
  script.onload = function () {
    console.log(gapi);
  };
  script.src = "//apis.google.com/js/api.js";
  document.head.appendChild(script);
}());
