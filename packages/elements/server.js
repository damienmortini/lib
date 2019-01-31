const browserSyncServer = require("browser-sync").create();

browserSyncServer.init({
  server: {
    baseDir: ".."
  },
  https: true,
  ghostMode: false,
  tunnel: false,
  open: false,
  notify: false,
  files: "."
});