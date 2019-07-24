import * as app from '..';
import * as path from 'path';

export class SessionLocal implements app.ISession {
  private readonly _basePath: string;
  private readonly _pageCount: number;
  private readonly _sessionId: string;
  
  constructor(seriesId: string, chapterId: string, pageCount: number) {
    this._basePath = path.join(app.settings.libraryCore, seriesId, chapterId);
    this._pageCount = pageCount;
    this._sessionId = app.createUniqueId();
  }

  expireAsync() {
    return Promise.resolve();
  }

  getData() {
    const id = this._sessionId;
    const pageCount = this._pageCount;
    const url = `file://${this._basePath}`;
    return {id, pageCount, url};
  }

  async getPageAsync(pageNumber: number) {
    try {
      if (pageNumber <= 0 || pageNumber > this._pageCount) return;
      const pagePath = path.join(this._basePath, app.zeroPrefix(pageNumber, 3));
      return await app.core.file.readJsonAsync<app.ISessionPage>(pagePath);
    } catch (error) {
      if (error && error.code === 'ENOENT') return;
      throw error;
    }
  }
}
