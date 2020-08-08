const app = require('./dist');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const express = require('express');
const http = require('http');
const swaggerUi = require('swagger-ui-dist');

async function routerAsync() {
  // Initialize the router.
  const router = express.Router();
  router.use(bodyParser.json());
  router.use(compression());
  router.use(cors());

  // Initialize the router handlers.
  router.get('/', (_, res) => res.redirect('/api/'));
  router.use('/api', express.static(`${__dirname}/public`));
  router.use('/api', express.static(swaggerUi.absolutePath())); 
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
