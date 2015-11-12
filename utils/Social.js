let readyPromise = new Promise((resolve) => {
  window.fbAsyncInit = () => {
    resolve();
  }
});

(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "//connect.facebook.net/en_US/sdk.js";
   fjs.parentNode.insertBefore(js, fjs);
 }(document, 'script', 'facebook-jssdk'));

export default class Social {
  static get ready() {
    return readyPromise;
  }
  static get facebook() {
    return FB;
  }
}
