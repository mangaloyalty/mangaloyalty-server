import * as os from 'os';
import * as path from 'path';

export const settings = {
  basePath: path.resolve(os.homedir(), 'mangaloyalty'),
  browserDefaultTimeout: 30000,
  browserHeadless: true,
  browserUserDataDir: 'chromeCache',
  browserViewport: {width: 1920, height: 974},
  remoteCacheTimeout: 600000,
  sessionTimeout: 600000,
};
