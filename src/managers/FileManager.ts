import * as app from '..';
import * as fs from 'fs-extra';
import * as path from 'path';

export class FileManager {
  async deleteAsync(relativePath: string) {
    await fs.remove(path.resolve(app.settings.basePath, relativePath));
  }
  
  async readJsonAsync<T>(relativePath: string) {
    return await fs.readJson(path.resolve(app.settings.basePath, relativePath)) as T;
  }

  async writeJsonAsync<T>(relativePath: string, value: T) {
    const absolutePath = path.resolve(app.settings.basePath, relativePath);
    await fs.ensureDir(path.dirname(absolutePath));
    await fs.writeJson(absolutePath, value, {spaces: 2});
  }
}
