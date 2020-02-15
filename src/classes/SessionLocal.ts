import * as app from '..';
import * as path from 'path';

export class SessionLocal implements app.ISession {
  private readonly _chapterId: string;
  private readonly _pageCount: number;
  private readonly _seriesId: string;
  private readonly _sessionId: string;
  private readonly _url: string;

  constructor(seriesId: string, chapterId: string, pageCount: number, url: string) {
    this._chapterId = chapterId;
    this._pageCount = pageCount;
    this._seriesId = seriesId;
    this._sessionId = app.createUniqueId();
    this._url = url;
  }

  endAsync() {
    return Promise.resolve();
  }

  getData() {
    const id = this._sessionId;
    const library = {seriesId: this._seriesId, chapterId: this._chapterId, sync: false};
    const pageCount = this._pageCount;
    const url = this._url;
    return {id, pageCount, url, library};
  }

  async getPageAsync(pageNumber: number) {
    try {
      if (pageNumber < 1 || pageNumber > this._pageCount) return;
      const absolutePath = path.join(app.settings.library, this._seriesId, this._chapterId, app.createPrefix(pageNumber, 3));
      return await app.core.resource.readFileAsync(absolutePath);
    } catch (error) {
      if (error && error.code === 'ENOENT') return;
      throw error;
    }
  }
}
