// TECH: Let the Chromium-instance automatically close when not used for some time, to preserve memory.
// UX: Provider: Connection issue retries. Immediate propagation is too severe.
// UX: Provider: Support missing images (http://fanfox.net/manga/star_martial_god_technique/c001/1.html).
// UX: Provider/Fanfox: Support for webtoons (https://fanfox.net/manga/solo_leveling/c000/1.html).
import * as api from 'express-openapi-json';
import * as app from '.';

// Initialize the openapi data.
const openapiData = require('../openapi.json');
const packageData = require('../package.json');
openapiData.info.version = packageData.version;

// Initialize the openapi router.
module.exports = api.createCore(openapiData)
  .controller(new app.RemoteController())
  .controller(new app.SessionController())
  .router();
