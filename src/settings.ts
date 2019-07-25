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
  cacheRemote: 'remote',
  cacheRemoteTimeout: 600000,
  cacheSession: 'session',
  library: 'library',
  librarySeries: 'series',
  librarySeriesPageSize: 70,
  sessionTimeout: 600000,
  sync: 'sync'
};
