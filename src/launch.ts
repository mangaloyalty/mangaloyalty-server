// TECH: Watch should clear in-memory persistence (including puppeteer.Response) for non-required/processed responses, and clear buffers asap.
// TECH: Cache responses should use file-to-response-streaming to avoid unnecessary serialization/deserialization steps.
// TECH: Chapters should split images across files for an efficient file-to-response-stream and no in-memory necessary.
// TECH: GZip compression, including pre-compression for cache files, to avoid compression overhead on each hit.
// UX: Provider: Connection issue retries. Immediate propagation is too severe.
// UX: Provider: Support missing images (http://fanfox.net/manga/star_martial_god_technique/c001/1.html).
// UX: Provider/Fanfox: Support for webtoons (https://fanfox.net/manga/solo_leveling/c000/1.html).
import * as api from 'express-openapi-json';
import * as app from '.';
import * as fs from 'fs-extra';
import * as path from 'path';

// Initialize the cache.
fs.removeSync(path.join(app.settings.basePath, app.settings.cacheCore));
fs.removeSync(path.join(app.settings.basePath, app.settings.syncCore));

// Initialize the openapi data.
const openapiData = require('../openapi.json');
const packageData = require('../package.json');
openapiData.info.version = packageData.version;

// Initialize the openapi router.
module.exports = api.createCore(openapiData)
  .controller(new app.LibraryController())
  .controller(new app.RemoteController())
  .controller(new app.SessionController())
  .router();
