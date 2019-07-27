import * as app from '..';
import * as path from 'path';

export class LibraryAdaptor implements app.IAdaptor {
  private readonly _chapterId: string;
  private readonly _context: app.LibraryContext;
  private readonly _lock: app.LibraryLock;
  private readonly _pages: app.FutureMap<void>;
  private readonly _seriesId: string;
  private readonly _syncId: string;
  private _isSyncSuccess?: boolean;

  constructor(context: app.LibraryContext, seriesId: string, chapterId: string) {
    this._chapterId = chapterId;
    this._context = context;
    this._lock = new app.LibraryLock();
    this._pages = new app.FutureMap();
    this._seriesId = seriesId;
    this._syncId = app.createUniqueId();
  }

  async expireAsync(pageCount: number) {
    await this._lock.acquireAsync(async () => {
      if (!pageCount || this._isSyncSuccess) return;
      await app.core.system.removeAsync(path.join(app.settings.sync, this._syncId));
    });
  }

  async getAsync(pageNumber: number) {
    await this._pages.getAsync(String(pageNumber));
    return await this._lock.acquireAsync(async () => {
      const buffer = await app.core.system.readFileAsync(this._createPath(pageNumber));
      const image = buffer.toString('base64');
      return {image};
    });
  }

  async setAsync(pageNumber: number, buffer: Buffer) {
    return await this._lock.acquireAsync(async () => {
      await app.core.system.writeFileAsync(this._createPath(pageNumber), buffer);
      await this._pages.resolve(String(pageNumber));
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
            chapter.syncAt = Date.now();
            const libraryPath = path.join(app.settings.library, this._seriesId, this._chapterId)
            const syncPath = path.join(app.settings.sync, this._syncId);
            await app.core.system.moveAsync(syncPath, libraryPath);
            await seriesContext.saveAsync();
            this._isSyncSuccess = true;
          }
        } catch (error) {
          if (error && error.code === 'ENOENT') return;
          throw error;
        }
      });
    });
  }
  
  private _createPath(pageNumber: number) {
    if (this._isSyncSuccess) {
      const fileName = app.createPrefix(pageNumber, 3);
      return path.join(app.settings.library, this._seriesId, this._chapterId, fileName);
    } else {
      const fileName = app.createPrefix(pageNumber, 3);
      return path.join(app.settings.sync, this._syncId, fileName);
    }
  }
}
