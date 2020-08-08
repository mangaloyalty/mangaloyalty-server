const app = require('./dist');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const express = require('express');
const http = require('http');

async function routerAsync() {
  // Initialize the router.
  const router = express.Router();
  router.use(bodyParser.json());
  router.use(compression());
  router.use(cors());

  // Initialize the router handlers.
  router.get('/', (_, res) => res.redirect('/api/'));
  router.get('/api', (req, res) => res.redirect(`https://petstore.swagger.io/?url=${encodeURIComponent(`${req.protocol}://${req.get('host')}/openapi.json`)}`));
  router.use((await app.bootAsync()).express());
  return router;
}

if (require.main && require.main.filename.startsWith(__dirname)) {
  routerAsync().then((router) => {
    const serverApp = express();
    const server = http.createServer(serverApp);
    app.attachSocket(server);
    serverApp.disable('x-powered-by');
    serverApp.use(router);
    server.listen(7783, () => console.log(`Server running on http://localhost:7783/`));
  });
} else {
  module.exports = {...app, routerAsync};
}
