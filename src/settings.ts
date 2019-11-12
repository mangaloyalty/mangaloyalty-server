import * as os from 'os';
import * as path from 'path';

export const settings = {
  basePath: path.resolve(os.homedir(), 'mangaloyalty'),
  browser: 'chrome',
  browserHeadless: true,
  browserExitTimeout: 60000,
  browserNavigationTimeout: 30000,
  browserUserData: 'user-data',
  browserViewport: {width: 1920, height: 974},
  cache: 'coreCache',
  cacheDataTimeout: 600000,
  cacheImageTimeout: 630000,
  imageLibraryTimeout: 600000,
  imageRemoteTimeout: 630000,
  imageSessionTimeout: 600000,
  library: 'library',
  libraryAutomationInterval: 600000,
  librarySeries: 'series',
  sessionTimeout: 600000,
  sync: 'sync'
};
