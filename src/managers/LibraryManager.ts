import * as app from '..';
import * as path from 'path';

export class LibraryManager {
  private _context?: app.LibraryContext;

  accessContext() {
    if (this._context) return this._context;
    this._context = new app.LibraryContext();
    return this._context;
  }

  async listAsync(readStatus: app.IEnumeratorReadStatus, seriesStatus: app.IEnumeratorSeriesStatus, sortKey: app.IEnumeratorSortKey, title?: string, pageNumber?: number) {
    return await this.accessContext().lockMainAsync(async () => {
      const ids = await app.core.system.readdirAsync(app.settings.library);
      const items = await Promise.all(ids.filter((id) => /^[0-9a-f]{48}$/.test(id)).map((id) => this.seriesReadAsync(id)));
      const validItems = items.filter(Boolean).map((series) => ({series: series!, unreadCount: computeUnreadCount(series!)}));
      return createPageResults(validItems.filter(createSeriesFilter(readStatus, seriesStatus, title)).sort(createSeriesSorter(sortKey)), pageNumber);
    });
  }

  async seriesCreateAsync(url: string) {
    return await this.accessContext().lockMainAsync(async () => {
      const remote = await app.provider.seriesAsync(url);
      const series = createSeries(remote);
      const seriesPath = path.join(app.settings.library, series.id, app.settings.librarySeries);
      synchronize(series, remote.chapters);
      await app.core.system.writeFileAsync(seriesPath, series);
      return series.id;
    });
  }

  async seriesDeleteAsync(seriesId: string) {
    return await this.accessContext().lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const seriesPath = path.join(app.settings.library, seriesId);
        const deletePath = path.join(app.settings.library, `_${seriesId}`);
        await app.core.system.moveAsync(seriesPath, deletePath);
        await app.core.system.removeAsync(deletePath);
        seriesContext.expire();
        return true;
      } catch (error) {
        if (error && error.code === 'ENOENT') return false;
        throw error;
      }
    });
  }

  async seriesReadAsync(seriesId: string) {
    return await this.accessContext().lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        return await seriesContext.getAsync();
      } catch (error) {
        if (error && error.code === 'ENOENT') return;
        throw error;
      }
    });
  }

  async seriesPatchAsync(seriesId: string, frequency: app.IEnumeratorFrequency, sync: boolean) {
    return await this.accessContext().lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        series.automation.frequency = frequency;
        series.automation.syncAll = sync;
        await seriesContext.saveAsync();
        return true;
      } catch (error) {
        if (error && error.code === 'ENOENT') return false;
        throw error;
      }
    });
  }

  async seriesUpdateAsync(seriesId: string) {
    return await this.accessContext().lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        const remote = await app.provider.seriesAsync(series.source.url);
        series.lastSyncAt = Date.now();
        series.source = createSeriesSource(remote);
        synchronize(series, remote.chapters);
        await seriesContext.saveAsync();
        return series;
      } catch (error) {
        if (error && error.code === 'ENOENT') return;
        throw error;
      }
    });
  }

  async chapterDeleteAsync(seriesId: string, chapterId: string) {
    return await this.accessContext().lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        const chapterPath = path.join(app.settings.library, seriesId, chapterId);
        const chapter = series.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter && chapter.deletedAt) {
          await app.core.system.removeAsync(chapterPath);
          series.chapters.splice(series.chapters.indexOf(chapter), 1);
          await seriesContext.saveAsync();
          return true;
        } else if (chapter && chapter.syncAt) {
          await app.core.system.removeAsync(chapterPath);
          delete chapter.syncAt;
          await seriesContext.saveAsync();
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
    return await this.accessContext().lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        const chapter = series.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter && chapter.pageCount && chapter.syncAt) {
          return app.core.session.add(new app.SessionLocal(this.accessContext(), seriesId, chapterId, chapter.pageCount));
        } else if (chapter) {
          return await this._startSessionAsync(this._createAdaptor(series.id, chapter.id, series.automation.syncAll), chapter, seriesContext);
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
    return await this.accessContext().lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        const chapter = series.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter && chapter.pageCount) {
          chapter.pageReadNumber = Math.max(1, Math.min(pageReadNumber, chapter.pageCount));
          await seriesContext.saveAsync();
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
    return await this.accessContext().lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        const chapter = series.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter) {
          return await this._startSessionAsync(this._createAdaptor(series.id, chapter.id, true), chapter, seriesContext);
        } else {
          return;
        }
      } catch (error) {
        if (error && error.code === 'ENOENT') return;
        throw error;
      }
    });
  }

  private _createAdaptor(seriesId: string, chapterId: string, syncAll: boolean) {
    return syncAll
      ? new app.LibraryAdaptor(this.accessContext(), seriesId, chapterId)
      : new app.CacheAdaptor(app.core.session.getOrCreateCache());
  }
  
  private async _startSessionAsync(adaptor: app.IAdaptor, chapter: app.ILibrarySeriesChapter, seriesContext: app.LibraryContextSeries) {
    const session = await app.provider.startAsync(adaptor, chapter.url);
    const sessionData = session.getData();
    if (chapter.pageCount === sessionData.pageCount) return session;
    chapter.pageCount = sessionData.pageCount;
    await seriesContext.saveAsync();
    return session;
  }
}

function createSeries(remote: app.IRemoteSeries): app.ILibrarySeries {
  const id = app.createUniqueId();
  const addedAt = Date.now();
  const lastSyncAt = Date.now();
  const automation: app.ILibrarySeriesAutomation = {frequency: 'never', syncAll: false};
  const chapters: app.ILibrarySeriesChapter[] = [];
  const source = createSeriesSource(remote);
  return {id, addedAt, lastSyncAt, automation, chapters, source};
}

function createSeriesSource(remote: app.IRemoteSeries): app.ILibrarySeriesSource {
  const authors = remote.authors;
  const genres = remote.genres;
  const image = remote.image;
  const isCompleted = remote.isCompleted;
  const summary = remote.summary;
  const title = remote.title;
  const url = remote.url;
  return {authors, genres, image, isCompleted, summary, title, url};
}

function createPageResults(filteredItems: {series: app.ILibrarySeries, unreadCount: number}[], pageNumber?: number) {
  const start = ((pageNumber || 1) - 1) * app.settings.librarySeriesPageSize;
  const stop = start + app.settings.librarySeriesPageSize;
  const hasMorePages = filteredItems.length > stop;
  const items = filteredItems.slice(start, stop).map((data) => ({id: data.series.id, image: data.series.source.image, title: data.series.source.title, unreadCount: data.unreadCount}));
  return {hasMorePages, items};
}

function createSeriesFilter(readStatus: app.IEnumeratorReadStatus, seriesStatus: app.IEnumeratorSeriesStatus, title?: string) {
  return (data: {series: app.ILibrarySeries, unreadCount: number}) => {
    if (readStatus === 'read' && data.unreadCount) return false;
    if (readStatus === 'unread' && !data.unreadCount) return false;
    if (seriesStatus === 'completed' && !data.series.source.isCompleted) return false;
    if (seriesStatus === 'ongoing' && data.series.source.isCompleted) return false;
    if (title && !title.split(/\s+/).every((piece) => data.series.source.title.toLocaleLowerCase().includes(piece.toLocaleLowerCase()))) return false;
    return true;
  }
}

function createSeriesSorter(sortBy: app.IEnumeratorSortKey) {
  return (a: {series: app.ILibrarySeries}, b: {series: app.ILibrarySeries}) => {
    switch (sortBy) {
      case 'addedAt': return b.series.addedAt - a.series.addedAt;
      case 'lastChapterAddedAt': return (b.series.lastChapterAddedAt || b.series.addedAt) - (a.series.lastChapterAddedAt || a.series.addedAt);
      case 'lastPageReadAt': return (b.series.lastPageReadAt || b.series.addedAt) - (a.series.lastPageReadAt || a.series.addedAt);
      case 'title': return a.series.source.title.toLocaleLowerCase().localeCompare(b.series.source.title.toLocaleLowerCase());
    }
  };
}

function computeUnreadCount(series: app.ILibrarySeries) {
  const chapters = series.chapters;
  const unreadChapters = chapters.filter((chapter) => !chapter.pageCount || !chapter.pageReadNumber || chapter.pageReadNumber < chapter.pageCount);
  return unreadChapters.length;
}

function synchronize(series: app.ILibrarySeries, remotes: app.IRemoteSeriesChapter[]) {
  const validIds: {[id: string]: boolean} = {};
  synchronizeExisting(series, remotes, validIds);
  synchronizeRemoved(series, validIds);
}

function synchronizeExisting(series: app.ILibrarySeries, remotes: app.IRemoteSeriesChapter[], validIds: {[id: string]: boolean}) {
  for (const remote of remotes) {
    const chapter = series.chapters.find((chapter) => chapter.url === remote.url);
    if (chapter) {
      chapter.title = remote.title;
      validIds[chapter.id] = true;
    } else {
      const id = app.createUniqueId();
      series.lastChapterAddedAt = Date.now();
      validIds[id] = Boolean(series.chapters.push({id, addedAt: Date.now(), title: remote.title, url: remote.url}));
    }
  }
}

function synchronizeRemoved(series: app.ILibrarySeries, validIds: {[id: string]: boolean}) {
  for (let i = 0; i < series.chapters.length; i++) {
    const chapter = series.chapters[i];
    if (validIds[chapter.id]) {
      continue;
    } else if (chapter.syncAt) {
      chapter.deletedAt = chapter.deletedAt || Date.now();
    } else {
      series.chapters.splice(i, 1);
      i--;
    }
  }
}
