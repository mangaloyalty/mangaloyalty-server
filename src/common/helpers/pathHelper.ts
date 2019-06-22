import * as os from 'os';
import * as path from 'path';
const basePath = [os.homedir(), 'mangaloyalty'];

export const pathHelper = {
  resolve(...args: string[]): string {
    return path.resolve.apply(path, basePath.concat(args));
  }
};
