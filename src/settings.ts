import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
const basePath = path.join(os.homedir(), 'mangaloyalty');
const settingsPath = path.join(basePath, 'settings.json');
const userSettings = fs.readJsonSync(settingsPath, {throws: false});

export const settings = Object.assign({
  cache: path.join(basePath, 'cache'),
  cacheDataTimeout: 600000,
  cacheImageTimeout: 1200000,
  chrome: path.join(basePath, 'chrome'),
  chromeHeadless: true,
  chromeExitTimeout: 60000,
  chromeNavigationTimeout: 30000,
  chromeUserData: 'user-data',
  chromeViewport: {width: 1920, height: 974},
  imageLibraryTimeout: 600000,
  imageRemoteTimeout: 1200000,
  imageSessionTimeout: 600000,
  library: path.join(basePath, 'library'),
  libraryAutomationTimeout: 600000,
  librarySeries: 'series',
  sessionTimeout: 600000,
  sync: path.join(basePath, 'sync')
}, userSettings);
