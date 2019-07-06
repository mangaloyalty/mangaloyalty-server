// TODO: Remote: Add pagination indicators (hasMorePages).
// UX: Provider: Connection issue retries. Immediate propagation is too severe.
// UX: Provider: Support missing images (http://fanfox.net/manga/star_martial_god_technique/c001/1.html).
// UX: Provider/Fanfox: Support for webtoons (https://fanfox.net/manga/solo_leveling/c000/1.html).
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-dist';
import * as api from 'express-openapi-json';
import * as app from '.';
const openapiData = require('../openapi.json');
const packageData = require('../package.json');
openapiData.info.version = packageData.version;

// Initialize the openapi router.
const openapi = api.createCore(openapiData)
  .controller(new app.RemoteController())
  .controller(new app.SessionController())
  .router();

// Initialize the server router.
const router = express.Router();
router.use(bodyParser.json());
router.use(cors());

// Initialize the server router paths.
router.get('/', (_, res) => res.redirect('/api'));
router.use('/api', express.static(`${__dirname}/../public`));
router.use('/api', express.static(swaggerUi.absolutePath()));
router.use(openapi);

// Initialize the server.
if (require.main === module) {
  const server = express();
  server.disable('x-powered-by');
  server.use(router);
  server.listen(7783, () => console.log(`Server running on http://localhost:7783/`));
} else {
  module.exports = router;
}
