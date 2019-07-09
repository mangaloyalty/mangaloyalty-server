import * as app from '..';
import * as path from 'path';

export const pathManager = {
  resolve(...args: string[]): string {
    return path.resolve.apply(path, [app.settings.basePath].concat(args));
  }
};
