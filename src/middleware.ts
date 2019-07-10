// TECH: Cache session images using the on-disk cache mechanism rather than in-memory, to preserve memory.
// TECH: Watch should clear in-memory persistence (including puppeteer.Response) for non-required/processed responses, and clear buffers asap.
// TECH: Cache responses should use file-to-response-streaming to avoid unnecessary serialization/deserialization steps.
// TECH: Sessions should have non-guessable ids (using crypto, like cache files).
// TECH: Chapters should split images across files for an efficient file-to-response-stream and no in-memory necessary.
// TECH: GZip compression, including pre-compression for cache files, to avoid compression overhead on each hit.
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
