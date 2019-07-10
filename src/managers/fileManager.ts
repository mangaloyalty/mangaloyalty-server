import * as app from '..';
import * as fs from 'fs-extra';

export const fileManager = {
  async deleteAsync(relativePath: string) {
    await fs.remove(app.pathManager.resolve(relativePath));
  },
  
  async readJsonAsync<T>(relativePath: string) {
    return await fs.readJson(app.pathManager.resolve(relativePath)) as T;
  },

  async writeJsonAsync<T>(relativePath: string, value: T) {
    const absolutePath = app.pathManager.resolve(relativePath);
    await fs.ensureFile(absolutePath);
    await fs.writeJson(absolutePath, value);
  }
};
