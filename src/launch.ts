// TECH: Automation should retain the sync properties in memory and hook up to API changes, to avoid re-reading files (and waking up HDD) unnecessarily.
// TECH: Library listings should retain the sortable properties in memory and only read the necessary files when requested.
// TECH: Move from strictly JSON over the API in favor of binary responses for pages (thus losing all validation in the process). The 30% bandwidth hit is too severe.
// TECH: Watch should clear in-memory persistence (including puppeteer.Response) for non-required/processed responses, and clear buffers asap.
// TECH: Cache and library responses should use file-to-response-streaming to avoid unnecessary serialization/deserialization steps.
// TECH: GZip compression, including pre-compression for cache files, to avoid compression overhead on each hit. Only for non-binary files!
// TECH: Filter and Map should be replaced with Linq-equivalents.
// UX: Core: Support an actual logger (logging into files, timestamps, traces).
// UX: Core: Support basePath configuration from CLI (e.g. "mangaloyalty-server C:\manga")
// UX: Core: Support custom configuration and expose listen port (read settings.json in basePath and merge).
// UX: Core: Support password authentication with anonymous access for local networks.
// UX: Provider: Connection issue retries. Immediate propagation is too severe.
// UX: Provider: Support missing images (http://fanfox.net/manga/star_martial_god_technique/c001/1.html).
// UX: Provider/Fanfox: Support for webtoons (https://fanfox.net/manga/solo_leveling/c000/1.html).
import * as api from 'express-openapi-json';
import * as app from '.';
import * as fs from 'fs-extra';
import * as path from 'path';

// Initialize the application.
fs.removeSync(path.join(app.settings.basePath, app.settings.cache));
fs.removeSync(path.join(app.settings.basePath, app.settings.sync));
setImmediate(() => app.core.automate.runWithTraceAsync());

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
