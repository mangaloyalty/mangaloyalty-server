import * as os from 'os';
import * as path from 'path';

export const settings = {
  basePath: path.resolve(os.homedir(), 'mangaloyalty'),
  browserCache: 'chromeCache',
  browserDefaultTimeout: 30000,
  browserHeadless: true,
  browserViewport: {width: 1920, height: 974},
  cacheCoreName: 'coreCache',
  cacheCoreTimeout: 1000,
  cacheRemoteName: 'remote',
  cacheRemoteTimeout: 600000,
  sessionTimeout: 600000,
};
