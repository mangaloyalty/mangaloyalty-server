import * as app from '..';
import * as path from 'path';

export class LibraryManager {
  private _context?: app.LibraryContext;

  async listAsync(pageNumber?: number) {
    return await this._ensureContext().lockMainAsync(async () => {
      const ids = await app.core.file.readdirAsync(app.settings.libraryCore);
      const items = await Promise.all(ids.filter((id) => /^[0-9a-f]{48}$/.test(id)).map((id) => this.seriesReadAsync(id)));
      const validItems = items.filter(Boolean).map((detail) => detail!);
      validItems.sort((a, b) => (b.lastChapterSyncAt || b.addedAt) - (a.lastChapterSyncAt || a.addedAt));
      return createPageResults(validItems, pageNumber);
    });
  }

  async seriesCreateAsync(url: string) {
    return await this._ensureContext().lockMainAsync(async () => {
      const source = await remoteSeriesAsync(url);
      const detail = createDetail(source);
      const detailPath = path.join(app.settings.libraryCore, detail.id, app.settings.librarySeriesName);
      await app.core.file.writeJsonAsync(detailPath, detail);
      return detail.id;
    });
  }

  async seriesDeleteAsync(seriesId: string) {
    return await this._ensureContext().lockSeriesAsync(seriesId, async () => {
      try {
        const seriesPath = path.join(app.settings.libraryCore, seriesId);
        const deletePath = path.join(app.settings.libraryCore, `_${seriesId}`);
        await app.core.file.moveAsync(seriesPath, deletePath);
        await app.core.file.removeAsync(deletePath);
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
        const detailPath = path.join(app.settings.libraryCore, seriesId, app.settings.librarySeriesName);
        const detail = await app.core.file.readJsonAsync<app.ILibraryDetail>(detailPath);
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
        const detailPath = path.join(app.settings.libraryCore, seriesId, app.settings.librarySeriesName);
        const detail = await app.core.file.readJsonAsync<app.ILibraryDetail>(detailPath);
        const source = await remoteSeriesAsync(detail.series.url);
        detail.lastSyncAt = Date.now();
        detail.series = createDetailSeries(source);
        synchronize(detail, source);
        await app.core.file.writeJsonAsync(detailPath, detail);
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
        const detailPath = path.join(app.settings.libraryCore, seriesId, app.settings.librarySeriesName);
        const detail = await app.core.file.readJsonAsync<app.ILibraryDetail>(detailPath);
        const chapter = detail.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter && chapter.syncAt) {
          delete chapter.syncAt;
          if (chapter.deletedAt) detail.chapters.splice(detail.chapters.indexOf(chapter), 1);
          await app.core.file.removeAsync(path.join(app.settings.libraryCore, seriesId, chapterId));
          await app.core.file.writeJsonAsync(detailPath, detail);
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
        const detailPath = path.join(app.settings.libraryCore, seriesId, app.settings.librarySeriesName);
        const detail = await app.core.file.readJsonAsync<app.ILibraryDetail>(detailPath);
        const chapter = detail.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter && chapter.pageCount && chapter.syncAt) {
          return app.core.session.add(new app.SessionLocal(seriesId, chapterId, chapter.pageCount)).getData();
        } else if (chapter) {
          const session = await remoteStartAsync(new app.CacheAdaptor(app.core.session.getOrCreateCache()), chapter.url);
          await this._ensurePageCountAsync(detail, chapter, session.pageCount);
          return session;
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
        const detailPath = path.join(app.settings.libraryCore, seriesId, app.settings.librarySeriesName);
        const detail = await app.core.file.readJsonAsync<app.ILibraryDetail>(detailPath);
        const chapter = detail.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter && chapter.pageCount) {
          chapter.pageReadNumber = Math.max(1, Math.min(pageReadNumber, chapter.pageCount));
          await app.core.file.writeJsonAsync(detailPath, detail);
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
        const detailPath = path.join(app.settings.libraryCore, seriesId, app.settings.librarySeriesName);
        const detail = await app.core.file.readJsonAsync<app.ILibraryDetail>(detailPath);
        const chapter = detail.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter) {
          const session = await remoteStartAsync(new app.LibraryAdaptor(this._ensureContext(), seriesId, chapterId), chapter.url);
          await this._ensurePageCountAsync(detail, chapter, session.pageCount);
          return session;
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

  private async _ensurePageCountAsync(detail: app.ILibraryDetail, chapter: app.ILibraryDetailChapter, pageCount: number) {
    const detailPath = path.join(app.settings.libraryCore, detail.id, app.settings.librarySeriesName);
    chapter.pageCount = pageCount;
    await app.core.file.writeJsonAsync(detailPath, detail);
  }
}

// TODO: Clean below.

function createPageResults(results: app.ILibraryDetail[], pageNumber?: number) {
  const startIndex = ((pageNumber || 1) - 1) * app.settings.librarySeriesPerPage;
  const stopIndex = startIndex + app.settings.librarySeriesPerPage;
  const hasMorePages = results.length > stopIndex;
  const items = results.slice(startIndex, stopIndex).map((detail) => ({id: detail.id, image: detail.series.image, title: detail.series.title}));
  return {hasMorePages, items};
}

function createDetail(source: app.IRemoteDetail): app.ILibraryDetail {
  const id = app.createUniqueId();
  const now = Date.now();
  const result = {id, addedAt: now, lastSyncAt: now, chapters: [], series: createDetailSeries(source)};
  synchronize(result, source);
  return result;
}

function createDetailSeries(source: app.IRemoteDetail): app.ILibraryDetailSeries {
  return {
    authors: source.authors,
    genres: source.genres,
    image: source.image,
    isCompleted: source.isCompleted,
    summary: source.summary,
    title: source.title,
    url: source.url
  };
}

async function remoteSeriesAsync(url: string) {
  if (app.batotoProvider.isSupported(url)) {
    return await app.batotoProvider.seriesAsync(url);
  } else if (app.fanfoxProvider.isSupported(url)) {
    return await app.fanfoxProvider.seriesAsync(url);
  } else {
    throw new Error();
  }
}

async function remoteStartAsync(adaptor: app.IAdaptor, url: string) {
  if (app.batotoProvider.isSupported(url)) {
    return await app.batotoProvider.startAsync(adaptor, url);
  } else if (app.fanfoxProvider.isSupported(url)) {
    return await app.fanfoxProvider.startAsync(adaptor, url);
  } else {
    throw new Error();
  }
}

// TODO: Clean me up
function synchronize(destination: app.ILibraryDetail, source: app.IRemoteDetail) {
  const knownIds: {[id: string]: boolean} = {};
  const now = Date.now();

  for (const sourceChapter of source.chapters) {
    const destinationChapter = destination.chapters.find((chapter) => chapter.url === sourceChapter.url);
    if (destinationChapter) {
      destinationChapter.title = sourceChapter.title;
      knownIds[destinationChapter.id] = true;
    } else {
      const id = app.createUniqueId();
      destination.chapters.push({id, addedAt: now, title: sourceChapter.title, url: sourceChapter.url});
      knownIds[id] = true;
    }
  }

  // TODO: should I remove non-stored chapters?
  for (const destinationChapter of destination.chapters) {
    if (knownIds[destinationChapter.id]) continue;
    if (!destinationChapter.deletedAt) destinationChapter.deletedAt = now;
  }
}
