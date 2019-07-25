import * as app from '..';
import * as path from 'path';

export class LibraryManager {
  private _context?: app.LibraryContext;

  async listAsync(pageNumber?: number) {
    return await this._ensureContext().lockMainAsync(async () => {
      const ids = await app.core.system.readdirAsync(app.settings.library);
      const items = await Promise.all(ids.filter((id) => /^[0-9a-f]{48}$/.test(id)).map((id) => this.seriesReadAsync(id)));
      const validItems = items.filter(Boolean).map((detail) => detail!);
      validItems.sort((a, b) => (b.lastChapterSyncAt || b.addedAt) - (a.lastChapterSyncAt || a.addedAt));
      return createPageResults(validItems, pageNumber);
    });
  }

  async seriesCreateAsync(url: string) {
    return await this._ensureContext().lockMainAsync(async () => {
      const source = await app.provider.seriesAsync(url);
      const detail = createDetail(source);
      const detailPath = path.join(app.settings.library, detail.id, app.settings.librarySeries);
      synchronize(detail.chapters, source.chapters);
      await app.core.system.writeJsonAsync(detailPath, detail);
      return detail.id;
    });
  }

  async seriesDeleteAsync(seriesId: string) {
    return await this._ensureContext().lockSeriesAsync(seriesId, async () => {
      try {
        const seriesPath = path.join(app.settings.library, seriesId);
        const deletePath = path.join(app.settings.library, `_${seriesId}`);
        await app.core.system.moveAsync(seriesPath, deletePath);
        await app.core.system.removeAsync(deletePath);
        return true;
      } catch (error) {
        if (error && error.code === 'ENOENT') return false;
        throw error;
      }
    });
  }

  async seriesReadAsync(seriesId: string) {
    return await this._ensureContext().lockSeriesAsync(seriesId, async () => {
      try {
        const detailPath = path.join(app.settings.library, seriesId, app.settings.librarySeries);
        const detail = await app.core.system.readJsonAsync<app.ILibraryDetail>(detailPath);
        return detail;
      } catch (error) {
        if (error && error.code === 'ENOENT') return;
        throw error;
      }
    });
  }

  async seriesUpdateAsync(seriesId: string) {
    return await this._ensureContext().lockSeriesAsync(seriesId, async () => {
      try {
        const detailPath = path.join(app.settings.library, seriesId, app.settings.librarySeries);
        const detail = await app.core.system.readJsonAsync<app.ILibraryDetail>(detailPath);
        const source = await app.provider.seriesAsync(detail.series.url);
        detail.lastSyncAt = Date.now();
        detail.series = createDetailSeries(source);
        synchronize(detail.chapters, source.chapters);
        await app.core.system.writeJsonAsync(detailPath, detail);
        return detail;
      } catch (error) {
        if (error && error.code === 'ENOENT') return;
        throw error;
      }
    });
  }

  async chapterDeleteAsync(seriesId: string, chapterId: string) {
    return await this._ensureContext().lockSeriesAsync(seriesId, async () => {
      try {
        const detailPath = path.join(app.settings.library, seriesId, app.settings.librarySeries);
        const detail = await app.core.system.readJsonAsync<app.ILibraryDetail>(detailPath);
        const chapterPath = path.join(app.settings.library, seriesId, chapterId);
        const chapter = detail.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter && chapter.deletedAt) {
          detail.chapters.splice(detail.chapters.indexOf(chapter), 1);
          await app.core.system.removeAsync(chapterPath);
          await app.core.system.writeJsonAsync(detailPath, detail);
          return true;
        } else if (chapter && chapter.syncAt) {
          delete chapter.syncAt;
          await app.core.system.removeAsync(chapterPath);
          await app.core.system.writeJsonAsync(detailPath, detail);
          return true;
        } else {
          return false;
        }
      } catch (error) {
        if (error && error.code === 'ENOENT') return false;
        throw error;
      }
    });
  }

  async chapterReadAsync(seriesId: string, chapterId: string) {
    return await this._ensureContext().lockSeriesAsync(seriesId, async () => {
      try {
        const detailPath = path.join(app.settings.library, seriesId, app.settings.librarySeries);
        const detail = await app.core.system.readJsonAsync<app.ILibraryDetail>(detailPath);
        const chapter = detail.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter && chapter.pageCount && chapter.syncAt) {
          return app.core.session.add(new app.SessionLocal(seriesId, chapterId, chapter.pageCount)).getData();
        } else if (chapter) {
          return await this._sessionAsync(new app.CacheAdaptor(app.core.session.getOrCreateCache()), detail, chapter);
        } else {
          return;
        }
      } catch (error) {
        if (error && error.code === 'ENOENT') return;
        throw error;
      }
    });
  }

  async chapterPatchAsync(seriesId: string, chapterId: string, pageReadNumber: number) {
    return await this._ensureContext().lockSeriesAsync(seriesId, async () => {
      try {
        const detailPath = path.join(app.settings.library, seriesId, app.settings.librarySeries);
        const detail = await app.core.system.readJsonAsync<app.ILibraryDetail>(detailPath);
        const chapter = detail.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter && chapter.pageCount) {
          chapter.pageReadNumber = Math.max(1, Math.min(pageReadNumber, chapter.pageCount));
          await app.core.system.writeJsonAsync(detailPath, detail);
          return true;
        } else {
          return false;
        }
      } catch (error) {
        if (error && error.code === 'ENOENT') return;
        throw error;
      }
    });
  }

  async chapterUpdateAsync(seriesId: string, chapterId: string) {
    return await this._ensureContext().lockSeriesAsync(seriesId, async () => {
      try {
        const detailPath = path.join(app.settings.library, seriesId, app.settings.librarySeries);
        const detail = await app.core.system.readJsonAsync<app.ILibraryDetail>(detailPath);
        const chapter = detail.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter) {
          return await this._sessionAsync(new app.LibraryAdaptor(this._ensureContext(), seriesId, chapterId), detail, chapter);
        } else {
          return;
        }
      } catch (error) {
        if (error && error.code === 'ENOENT') return;
        throw error;
      }
    });
  }

  private _ensureContext() {
    if (this._context) return this._context;
    this._context = new app.LibraryContext();
    return this._context;
  }

  private async _sessionAsync(adaptor: app.IAdaptor, detail: app.ILibraryDetail, chapter: app.ILibraryDetailChapter) {
    const detailPath = path.join(app.settings.library, detail.id, app.settings.librarySeries);
    const session = await app.provider.startAsync(adaptor, chapter.url);
    chapter.pageCount = session.pageCount;
    await app.core.system.writeJsonAsync(detailPath, detail);
    return session;
  }
}

function createDetail(source: app.IRemoteDetail): app.ILibraryDetail {
  const id = app.createUniqueId();
  const addedAt = Date.now();
  const lastSyncAt = Date.now();
  const chapters: app.ILibraryDetailChapter[] = [];
  const series = createDetailSeries(source);
  return {id, addedAt, lastSyncAt, chapters, series};
}

function createDetailSeries(source: app.IRemoteDetail): app.ILibraryDetailSeries {
  const authors = source.authors;
  const genres = source.genres;
  const image = source.image;
  const isCompleted = source.isCompleted;
  const summary = source.summary;
  const title = source.title;
  const url = source.url;
  return {authors, genres, image, isCompleted, summary, title, url};
}

function createPageResults(results: app.ILibraryDetail[], pageNumber?: number) {
  const startIndex = ((pageNumber || 1) - 1) * app.settings.librarySeriesPageSize;
  const stopIndex = startIndex + app.settings.librarySeriesPageSize;
  const hasMorePages = results.length > stopIndex;
  const items = results.slice(startIndex, stopIndex).map((detail) => ({id: detail.id, image: detail.series.image, title: detail.series.title}));
  return {hasMorePages, items};
}

function synchronize(detail: app.ILibraryDetailChapter[], source: app.IRemoteDetailChapter[]) {
  const validIds: {[id: string]: boolean} = {};
  synchronizeExisting(detail, source, validIds);
  synchronizeRemoved(detail, validIds);
}

function synchronizeExisting(detail: app.ILibraryDetailChapter[], source: app.IRemoteDetailChapter[], validIds: {[id: string]: boolean}) {
  for (const sourceChapter of source) {
    const detailChapter = detail.find((chapter) => chapter.url === sourceChapter.url);
    if (detailChapter) {
      detailChapter.title = sourceChapter.title;
      validIds[detailChapter.id] = true;
    } else {
      const id = app.createUniqueId();
      validIds[id] = Boolean(detail.push({id, addedAt: Date.now(), title: sourceChapter.title, url: sourceChapter.url}));
    }
  }
}

function synchronizeRemoved(detail: app.ILibraryDetailChapter[], validIds: {[id: string]: boolean}) {
  for (let i = 0; i < detail.length; i++) {
    const detailChapter = detail[i];
    if (validIds[detailChapter.id]) {
      continue;
    } else if (detailChapter.syncAt) {
      detailChapter.deletedAt = detailChapter.deletedAt || Date.now();
    } else {
      detail.splice(i, 1);
      i--;
    }
  }
}
