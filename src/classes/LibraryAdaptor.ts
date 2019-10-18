import * as app from '..';
import * as path from 'path';

export class LibraryAdaptor implements app.IAdaptor {
  private readonly _chapterId: string;
  private readonly _context: app.LibraryContext;
  private readonly _futurePages: app.FutureMap<void>;
  private readonly _lock: app.LibraryLock;
  private readonly _seriesId: string;
  private readonly _syncId: string;
  private _hasMoved?: boolean;

  constructor(context: app.LibraryContext, seriesId: string, chapterId: string) {
    this._chapterId = chapterId;
    this._context = context;
    this._futurePages = new app.FutureMap();
    this._lock = new app.LibraryLock();
    this._seriesId = seriesId;
    this._syncId = app.createUniqueId();
  }

  get detailLibrary() {
    const seriesId = this._seriesId;
    const chapterId = this._chapterId;
    const sync = true;
    return {seriesId, chapterId, sync};
  }

  async endAsync(pageCount: number) {
    await this._lock.acquireAsync(async () => {
      if (!pageCount || this._hasMoved) return;
      await app.core.system.removeAsync(path.join(app.settings.sync, this._syncId));
    });
  }

  async getAsync(pageNumber: number) {
    await this._futurePages.getAsync(String(pageNumber));
    return await this._lock.acquireAsync(async () => {
      return await app.core.system.readFileAsync(this._createPath(pageNumber));
    });
  }

  async setAsync(pageNumber: number, image: Buffer) {
    return await this._lock.acquireAsync(async () => {
      await app.core.system.writeFileAsync(this._createPath(pageNumber), image);
      await this._futurePages.resolve(String(pageNumber));
    });
  }
  
  async successAsync(pageCount: number) {
    await this._lock.acquireAsync(async () => {
      if (!pageCount) return;
      await this._context.lockSeriesAsync(this._seriesId, async (seriesContext) => {
        try {
          const series = await seriesContext.getAsync();
          const chapter = series.chapters.find((chapter) => chapter.id === this._chapterId);
          if (chapter) {
            await this._moveAsync();
            chapter.pageCount = pageCount;
            chapter.syncAt = Date.now();
            await seriesContext.saveAsync();
            await app.core.socket.queueAsync({type: 'ChapterUpdate', seriesId: this._seriesId, chapterId: this._chapterId});
          }
        } catch (error) {
          if (error && error.code === 'ENOENT') return;
          throw error;
        }
      });
    });
  }
  
  private _createPath(pageNumber: number) {
    return this._hasMoved
      ? path.join(app.settings.library, this._seriesId, this._chapterId, app.createPrefix(pageNumber, 3))
      : path.join(app.settings.sync, this._syncId, app.createPrefix(pageNumber, 3));
  }

  private async _moveAsync() {
    const libraryPath = path.join(app.settings.library, this._seriesId, this._chapterId);
    const syncPath = path.join(app.settings.sync, this._syncId);
    await app.core.system.moveAsync(syncPath, libraryPath);
    this._hasMoved = true;
  }
}
