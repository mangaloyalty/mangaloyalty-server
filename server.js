const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const swaggerUi = require('swagger-ui-dist');

// Initialize the server router.
const router = express.Router();
router.use(bodyParser.json());
router.use(cors());

// Initialize the server router handlers.
router.get('/', (_, res) => res.redirect('/api/'));
router.use('/api', express.static(`${__dirname}/public`));
router.use('/api', express.static(swaggerUi.absolutePath()));
router.use(require('./dist/middleware'));

// Initialize the server.
if (require.main && require.main.filename.startsWith(__dirname)) {
  const server = express();
  server.disable('x-powered-by');
  server.use(router);
  server.listen(7783, () => console.log(`Server running on http://localhost:7783/`));
} else {
  module.exports = router;
}
