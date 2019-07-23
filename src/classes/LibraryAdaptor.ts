import * as app from '..';
import * as path from 'path';

export class LibraryAdaptor implements app.IAdaptor {
  private readonly _chapterId: string;
  private readonly _context: app.LibraryContext;
  private readonly _lock: app.LibraryLock;
  private readonly _pages: app.FutureMap<void>;
  private readonly _seriesId: string;
  private readonly _syncId: string;
  private _isInLibrary?: boolean;

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
      if (!pageCount || this._isInLibrary) return;
      const syncPath = path.join(app.settings.syncCore, this._syncId);
      await app.core.file.removeAsync(syncPath);
    });
  }

  async getAsync(pageNumber: number) {
    await this._pages.getAsync(String(pageNumber));
    return await this._lock.acquireAsync(async () => {
      const page = await app.core.file.readJsonAsync<app.ISessionPage>(this._createPath(pageNumber));
      return page;
    });
  }

  async setAsync(pageNumber: number, page: app.ISessionPage) {
    return await this._lock.acquireAsync(async () => {
      await app.core.file.writeJsonAsync(this._createPath(pageNumber), page);
      await this._pages.resolve(String(pageNumber));
    });
  }
  
  async successAsync(pageCount: number) {
    await this._lock.acquireAsync(async () => {
      if (!pageCount) return;
      await this._context.lockSeriesAsync(this._seriesId, async () => {
        try {
          const detailPath = path.join(app.settings.libraryCore, this._seriesId, app.settings.librarySeriesName);
          const detail = await app.core.file.readJsonAsync<app.ILibraryDetail>(detailPath);
          const chapter = detail.chapters.find((chapter) => chapter.id === this._chapterId);
          if (chapter) {
            detail.lastChapterSyncAt = Date.now();
            chapter.pageCount = pageCount;
            chapter.syncAt = Date.now();
            await this._moveAsync();
            await app.core.file.writeJsonAsync(detailPath, detail);
            this._isInLibrary = true;
          }
        } catch (error) {
          if (error && error.code === 'ENOENT') return;
          throw error;
        }
      });
    });
  }
  
  private _createPath(pageNumber: number) {
    if (this._isInLibrary) {
      return path.join(app.settings.libraryCore, this._seriesId, this._chapterId, serializePageNumber(pageNumber));
    } else {
      return path.join(app.settings.syncCore, this._syncId, serializePageNumber(pageNumber));
    }
  }

  private async _moveAsync() {
    const libraryPath = path.join(app.settings.libraryCore, this._seriesId, this._chapterId)
    const syncPath = path.join(app.settings.syncCore, this._syncId);
    await app.core.file.moveAsync(syncPath, libraryPath);
  }
}

function serializePageNumber(value: number) {
  let pageNumber = String(value);
  while (pageNumber.length < 3) pageNumber = `0${pageNumber}`;
  return pageNumber;
}
