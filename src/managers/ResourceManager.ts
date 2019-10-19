import * as app from '..';
import * as fs from 'fs-extra';
import * as path from 'path';

export class ResourceManager {
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

  async readFileAsync(relativePath: string) {
    return await fs.readFile(path.join(app.settings.basePath, relativePath));
  }

  async readJsonAsync<T>(relativePath: string) {
    return await fs.readJson(path.join(app.settings.basePath, relativePath)) as T;
  }

  async removeAsync(relativePath: string) {
    await fs.remove(path.join(app.settings.basePath, relativePath));
  }

  async writeFileAsync<T>(relativePath: string, value: T) {
    const absolutePath = path.join(app.settings.basePath, relativePath);
    const absolutePathTmp = `${absolutePath}.tmp`;
    try {
      await fs.ensureDir(path.dirname(absolutePath));
      await (Buffer.isBuffer(value) ? fs.writeFile(absolutePathTmp, value) : fs.writeJson(absolutePathTmp, value, {spaces: 2}));
      await fs.move(absolutePathTmp, absolutePath, {overwrite: true});
    } catch (error) {
      await fs.remove(absolutePathTmp);
      throw error;
    }
  }
}
