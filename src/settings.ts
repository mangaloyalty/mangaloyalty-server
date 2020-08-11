import * as os from 'os';
import * as path from 'path';

export const settings = {
  actionExpireTimeout: 10000,
  actionWaitTimeout: 60000,
  cache: path.join(os.homedir(), 'mangaloyalty', 'cache'),
  cacheDataTimeout: 600000,
  cacheImageTimeout: 1200000,
  chrome: path.join(os.homedir(), 'mangaloyalty', 'chrome'),
  chromeHeadless: true,
  chromeExitTimeout: 60000,
  chromeNavigationTimeout: 30000,
  chromeUserData: 'user-data',
  chromeViewport: {width: 1920, height: 974},
  imageLibraryTimeout: 600000,
  imageRemoteTimeout: 1200000,
  imageSessionTimeout: 600000,
  library: path.join(os.homedir(), 'mangaloyalty', 'library'),
  libraryAutomationTimeout: 600000,
  librarySeries: 'series',
  logger: path.join(os.homedir(), 'mangaloyalty', 'mangaloyalty.log'),
  sessionTimeout: 600000,
  sync: path.join(os.homedir(), 'mangaloyalty', 'sync')
};
