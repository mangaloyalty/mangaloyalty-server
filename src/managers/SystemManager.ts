import * as app from '..';
import * as fs from 'fs-extra';
import * as path from 'path';

export class SystemManager {
  async moveAsync(relativeFromPath: string, relativeToPath: string) {
    const absoluteFromPath = path.join(app.settings.basePath, relativeFromPath);
    const absoluteToPath = path.join(app.settings.basePath, relativeToPath);
    await fs.move(absoluteFromPath, absoluteToPath, {overwrite: true});
  }

  async readdirAsync(relativePath: string) {
    const absolutePath = path.join(app.settings.basePath, relativePath);
    await fs.ensureDir(absolutePath);
    return await fs.readdir(absolutePath);
  }

  async readJsonAsync<T>(relativePath: string) {
    return await fs.readJson(path.join(app.settings.basePath, relativePath)) as T;
  }

  async removeAsync(relativePath: string) {
    await fs.remove(path.join(app.settings.basePath, relativePath));
  }

  async writeJsonAsync<T>(relativePath: string, value: T) {
    const absolutePath = path.join(app.settings.basePath, relativePath);
    const absolutePathTmp = `${absolutePath}.tmp`;
    await fs.ensureDir(path.dirname(absolutePath));
    await fs.writeJson(absolutePathTmp, value, {spaces: 2});
    try {
      await fs.move(absolutePathTmp, absolutePath, {overwrite: true});
    } catch (error) {
      await fs.remove(absolutePathTmp);
      throw error;
    }
  }
}
