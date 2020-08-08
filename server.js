const app = require('.');
const http = require('http');

if (require.main && require.main.filename.startsWith(__dirname)) {
  app.bootAsync().then((router) => {
    const server = http.createServer(app.attachRouter(router));
    app.attachSocket(server);
    server.listen(7783, () => console.log(`Server running on http://localhost:7783/`));
  });
} else {
  module.exports = app;
}
