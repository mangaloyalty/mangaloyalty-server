import * as os from 'os';
import * as path from 'path';

export const settings = {
  basePath: path.resolve(os.homedir(), 'mangaloyalty'),
  browser: 'chromeCache',
  browserHeadless: true,
  browserExitTimeout: 60000,
  browserNavigationTimeout: 30000,
  browserViewport: {width: 1920, height: 974},
  cache: 'coreCache',
  cacheRemoteTimeout: 600000,
  library: 'library',
  libraryAutomationInterval: 600000,
  librarySeries: 'series',
  librarySeriesPageSize: 60,
  sessionTimeout: 600000,
  sync: 'sync'
};
