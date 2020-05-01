import io from 'socket.io';
import * as api from 'express-openapi-json';
import * as app from '.';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';

export function attachSocket(server: http.Server) {
  const sio = io(server);
  app.core.socket.addEventListener((action) => sio.emit('action', action));
}

export async function bootAsync() {
  // Initialize the application data.
  const settings = await app.core.resource.readJsonAsync(path.join(os.homedir(), 'mangaloyalty', 'settings.json')).catch(() => undefined);
  await app.core.resource.removeAsync(app.settings.cache);
  await app.core.resource.removeAsync(app.settings.sync);

  // Initialize the application system.
  Object.assign(app.settings, settings);
  setImmediate(() => app.core.automate.run());
  setImmediate(() => app.core.browser.prepareAsync().catch((error) => app.core.trace.error(error)));

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
