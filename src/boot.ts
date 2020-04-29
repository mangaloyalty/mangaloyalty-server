import io from 'socket.io';
import * as api from 'express-openapi-json';
import * as app from '.';
import * as fs from 'fs-extra';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';

export function attachSocket(server: http.Server) {
  const sio = io(server);
  app.core.socket.addEventListener((action) => sio.emit('action', action));
}

export function bootApp() {
  // Initialize the application data.
  Object.assign(app.settings, fs.readJsonSync(path.join(os.homedir(), 'mangaloyalty', 'settings.json'), {throws: false}));
  fs.removeSync(app.settings.cache);
  fs.removeSync(app.settings.sync);

  // Initialize the application system.
  setImmediate(() => app.core.automate.tryRun());
  setImmediate(() => app.core.browser.prepareWithTraceAsync());

  // Initialize the openapi data.
  const openapiData = require('../openapi.json');
  const packageData = require('../package.json');
  openapiData.info.version = packageData.version;

  // Initialize the openapi router.
  return api.createCore(openapiData)
    .controller(new app.LibraryController())
    .controller(new app.RemoteController())
    .controller(new app.SessionController())
    .router();
}
