import * as api from 'express-openapi-json';
import * as app from '.';
import * as fs from 'fs-extra';
import * as http from 'http';
import * as io from 'socket.io';
import * as os from 'os';
import * as path from 'path';
Object.assign(app.settings, fs.readJsonSync(path.join(os.homedir(), 'mangaloyalty', 'settings.json'), {throws: false}));
fs.removeSync(path.join(os.homedir(), 'mangaloyalty', 'chromeCache')); // <= 0.6.0
fs.removeSync(path.join(os.homedir(), 'mangaloyalty', 'coreCache'));   // <= 0.7.0

// Initialize the application.
fs.removeSync(app.settings.cache);
fs.removeSync(app.settings.sync);
setImmediate(() => app.core.automate.tryRun());
setImmediate(() => app.core.browser.prepareWithTraceAsync());

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
  app.core.socket.addEventListener((action) => sio.emit('action', action));
}
