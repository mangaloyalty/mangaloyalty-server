const app = require('.');
const http = require('http');

if (require.main && require.main.filename.startsWith(__dirname)) {
  app.bootAsync().then((router) => http
    .createServer(router.node())
    .listen(7783, () => console.log(`Server running on http://localhost:7783/`)));
} else {
  module.exports = app;
}
