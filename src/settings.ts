import * as os from 'os';
import * as path from 'path';

export const settings = {
  basePath: path.resolve(os.homedir(), 'mangaloyalty'),
  browserCache: 'chromeCache',
  browserHeadless: true,
  browserExitTimeout: 60000,
  browserNavigationTimeout: 30000,
  browserViewport: {width: 1920, height: 974},
  cacheCore: 'coreCache',
  cacheRemoteName: 'remote',
  cacheRemoteTimeout: 600000,
  cacheSessionName: 'session',
  libraryCore: 'library',
  librarySeriesName: 'series',
  librarySeriesPerPage: 70,
  sessionTimeout: 600000,
};
