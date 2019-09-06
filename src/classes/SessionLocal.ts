import * as app from '..';
import * as path from 'path';

export class SessionLocal implements app.ISession {
  private readonly _chapterId: string;
  private readonly _context: app.LibraryContext;
  private readonly _pageCount: number;
  private readonly _seriesId: string;
  private readonly _sessionId: string;
  private readonly _url: string;

  constructor(context: app.LibraryContext, seriesId: string, chapterId: string, pageCount: number, url: string) {
    this._chapterId = chapterId;
    this._context = context;
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
    const isLocal = true;
    const library = {seriesId: this._seriesId, chapterId: this._chapterId, sync: false};
    const pageCount = this._pageCount;
    const url = this._url;
    return {id, isLocal, pageCount, url, library};
  }

  async getPageAsync(pageNumber: number) {
    return await this._context.lockSeriesAsync(this._seriesId, async () => {
      try {
        if (pageNumber <= 0 || pageNumber > this._pageCount) return;
        const buffer = await app.core.system.readFileAsync(path.join(app.settings.library, this._seriesId, this._chapterId, app.createPrefix(pageNumber, 3)));
        const image = buffer.toString('base64');
        return {image};
      } catch (error) {
        if (error && error.code === 'ENOENT') return;
        throw error;
      }
    });
  }
}
