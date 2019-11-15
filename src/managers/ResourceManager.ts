import * as fs from 'fs-extra';
import * as path from 'path';

export class ResourceManager {
  async moveAsync(absoluteFromPath: string, absoluteToPath: string) {
    await fs.move(absoluteFromPath, absoluteToPath, {overwrite: true});
  }

  async readdirAsync(absolutePath: string) {
    await fs.ensureDir(absolutePath);
    return await fs.readdir(absolutePath);
  }

  async readFileAsync(absolutePath: string) {
    return await fs.readFile(absolutePath);
  }

  async readJsonAsync<T>(absolutePath: string) {
    return await fs.readJson(absolutePath) as T;
  }

  async removeAsync(absolutePath: string) {
    await fs.remove(absolutePath);
  }

  async writeFileAsync<T>(absolutePath: string, value: T) {
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
