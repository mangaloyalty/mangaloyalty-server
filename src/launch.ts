// TODO: Handle non-image data. We actually stored HTML at some point (serving a 404).
// TECH: Watch should clear in-memory persistence (including puppeteer.Response) for non-required/processed responses, and clear buffers asap.
// UX: Core: Support an actual logger (logging into files, timestamps, traces).
// UX: Core: Support basePath configuration from CLI (e.g. "mangaloyalty-server C:\manga")
// UX: Core: Support custom configuration and expose listen port (read settings.json in basePath and merge).
// UX: Core: Support password authentication with anonymous access for local networks.
// UX: Provider: Connection issue retries. Immediate propagation is too severe.
// UX: Provider: Support missing images (http://fanfox.net/manga/star_martial_god_technique/c001/1.html).
import * as api from 'express-openapi-json';
import * as app from '.';
import * as fs from 'fs-extra';
import * as http from 'http';
import * as io from 'socket.io';
import * as path from 'path';

// Initialize the application.
fs.removeSync(path.join(app.settings.basePath, app.settings.cache));
fs.removeSync(path.join(app.settings.basePath, app.settings.sync));
setImmediate(() => app.core.automate.tryRun());

// Initialize the openapi data.
const openapiData = require('../openapi.json');
const packageData = require('../package.json');
openapiData.info.version = packageData.version;

// Initialize the openapi router.
export const router = api.createCore(openapiData)
  .controller(new app.LibraryController())
  .controller(new app.RemoteController())
  .controller(new app.SessionController())
  .router();
  
// Initialize the socket attach function.
export function attachSocket(server: http.Server) {
  const sio = io.default(server);
  app.core.socket.addEventListener((action) => {
    sio.emit('action', action);
    return Promise.resolve();
  });
}
