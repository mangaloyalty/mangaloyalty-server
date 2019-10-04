const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const http = require('http');
const launchApp = require('./dist/launch');
const swaggerUi = require('swagger-ui-dist');

// Initialize the server router.
const router = express.Router();
router.use(bodyParser.json());
router.use(cors());

// Initialize the server router handlers.
router.get('/', (_, res) => res.redirect('/api/'));
router.use('/api', express.static(`${__dirname}/public`));
router.use('/api', express.static(swaggerUi.absolutePath()));
router.use(launchApp.router);

// Initialize the server.
if (require.main && require.main.filename.startsWith(__dirname)) {
  const serverApp = express();
  const server = http.createServer(serverApp);
  launchApp.attachSocket(server);
  serverApp.disable('x-powered-by');
  serverApp.use(router);
  server.listen(7783, () => console.log(`Server running on http://localhost:7783/`));
} else {
  module.exports = {attachSocket: launchApp.attachSocket, router};
}
