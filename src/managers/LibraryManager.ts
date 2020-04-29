import * as app from '..';
import * as path from 'path';

export class LibraryManager implements app.ILibraryManager {
  private _cache?: string[];
  private _context: app.LibraryContext;
  
  constructor() {
    this._context = new app.LibraryContext();
  }

  async listReadAsync(readStatus: app.IEnumeratorReadStatus, seriesStatus: app.IEnumeratorSeriesStatus, sortKey: app.IEnumeratorSortKey, title?: string) {
    return await this._context.lockMainAsync(async () => {
      const ids = await this._listAsync();
      const series = await Promise.all(ids.map((id) => this.seriesReadAsync(id)));
      return series.filter(Boolean)
        .map((series) => ({series: series!, unreadCount: series!.chapters.filter((chapter) => !chapter.isReadCompleted).length}))
        .filter(createSeriesFilter(readStatus, seriesStatus, title))
        .sort(createSeriesSorter(sortKey))
        .map((data) => ({id: data.series.id, title: data.series.source.title, unreadCount: data.unreadCount, url: data.series.source.url}));
    });
  }

  async listPatchAsync(frequency: app.IEnumeratorFrequency, strategy: app.IEnumeratorStrategy) {
    await this._context.lockMainAsync(async () => {
      const ids = await this._listAsync();
      await Promise.all(ids.map((id) => this.seriesPatchAsync(id, frequency, strategy)));
    });
  }

  async seriesCheckedAsync(seriesId: string) {
    return await this._context.lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        series.automation.checkedAt = Date.now();
        await seriesContext.saveAsync();
        return true;
      } catch (error) {
        if (error && error.code === 'ENOENT') return false;
        throw error;
      }
    });
  }

  async seriesCreateAsync(url: string) {
    const remote = await app.provider.seriesAsync(url);
    const remoteImage = await app.provider.imageAsync(remote.imageId);
    return await this._context.lockMainAsync(async () => {
      const series = createSeries(remote, remoteImage);
      const seriesPath = path.join(app.settings.library, series.id, app.settings.librarySeries);
      synchronize(series, remote.chapters);
      await app.core.resource.writeFileAsync(seriesPath, series);
      delete this._cache;
      app.core.socket.emit({type: 'SeriesCreate', seriesId: series.id, seriesUrl: series.source.url});
      return series.id;
    });
  }

  async seriesDeleteAsync(seriesId: string) {
    return await this._context.lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const seriesPath = path.join(app.settings.library, seriesId);
        const deletePath = path.join(app.settings.library, `_${seriesId}`);
        await app.core.resource.moveAsync(seriesPath, deletePath);
        await app.core.resource.removeAsync(deletePath);
        delete this._cache;
        seriesContext.expire();
        app.core.socket.emit({type: 'SeriesDelete', seriesId});
        return true;
      } catch (error) {
        if (error && error.code === 'ENOENT') return false;
        throw error;
      }
    });
  }

  async seriesDumpAsync(seriesId: string, writableStream: NodeJS.WritableStream) {
    const series = await this.seriesReadAsync(seriesId);
    const chapters = series && series.chapters.slice().reverse() || [];
    await app.Zipper.createAsync(writableStream, async (zipper) => {
      for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
        const chapter = chapters[chapterIndex];
        const chapterFolder = `[${app.createPageName(chapterIndex)}] ${chapter.title}`;
        if (!chapter.pageCount || !chapter.syncAt) {
          await zipper.directoryAsync(chapterFolder);
        } else for (let pageNumber = 1; pageNumber <= chapter.pageCount; pageNumber++) {
          const pageName = app.createPageName(pageNumber);
          const image = await app.core.resource.readFileAsync(path.join(app.settings.library, seriesId, chapter.id, pageName));
          const imageType = app.detectImage(image);
          if (imageType) await zipper.fileAsync(`${chapterFolder}/${pageName}.${imageType.extension}`, image);
        }
      }
    });
  }

  async seriesImageAsync(seriesId: string) {
    return await this._context.lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        const image = series.source.image;
        return image ? Buffer.from(image, 'base64') : undefined;
      } catch (error) {
        if (error && error.code === 'ENOENT') return;
        throw error;
      }
    });
  }

  async seriesReadAsync(seriesId: string) {
    return await this._context.lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        const result = Object.assign({}, series);
        result.source = Object.assign({}, series.source);
        return result;
      } catch (error) {
        if (error && error.code === 'ENOENT') return;
        throw error;
      }
    });
  }

  async seriesPatchAsync(seriesId: string, frequency: app.IEnumeratorFrequency, strategy: app.IEnumeratorStrategy) {
    return await this._context.lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        delete series.automation.checkedAt;
        series.automation.frequency = frequency;
        series.automation.strategy = strategy;
        await seriesContext.saveAsync();
        app.core.socket.emit({type: 'SeriesPatch', seriesId});
        app.core.automate.run();
        return true;
      } catch (error) {
        if (error && error.code === 'ENOENT') return false;
        throw error;
      }
    });
  }
  
  async seriesUpdateAsync(seriesId: string) {
    const series = await this.seriesReadAsync(seriesId);
    const remote = series && await app.provider.seriesAsync(series.source.url);
    const remoteImage = remote && await app.provider.imageAsync(remote.imageId);
    if (!remote) return false;
    return await this._context.lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        series.lastSyncAt = Date.now();
        series.source = createSeriesSource(remote, remoteImage, series.source);
        synchronize(series, remote.chapters);
        await seriesContext.saveAsync();
        app.core.socket.emit({type: 'SeriesUpdate', seriesId});
        return true;
      } catch (error) {
        if (error && error.code === 'ENOENT') return false;
        throw error;
      }
    });
  }

  async chapterDeleteAsync(seriesId: string, chapterId: string) {
    return await this._context.lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        const chapterPath = path.join(app.settings.library, seriesId, chapterId);
        const chapter = series.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter && chapter.deletedAt) {
          await app.core.resource.removeAsync(chapterPath);
          series.chapters.splice(series.chapters.indexOf(chapter), 1);
          await seriesContext.saveAsync();
          app.core.socket.emit({type: 'ChapterDelete', seriesId, chapterId});
          return true;
        } else if (chapter && chapter.syncAt) {
          await app.core.resource.removeAsync(chapterPath);
          delete chapter.syncAt;
          await seriesContext.saveAsync();
          app.core.socket.emit({type: 'ChapterDelete', seriesId, chapterId});
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
    const series = await this.seriesReadAsync(seriesId);
    const chapter = series && series.chapters.find((chapter) => chapter.id === chapterId);
    if (chapter && chapter.pageCount && chapter.syncAt) {
      return app.core.session.add(new app.SessionLocal(seriesId, chapterId, chapter.pageCount, chapter.url));
    } else if (series && chapter && (series.automation.strategy === 'all' || (series.automation.strategy === 'unread' && !chapter.isReadCompleted))) {
      return await app.provider.startAsync(new app.AdaptorLibrary(this._context, seriesId, chapterId), chapter.url);
    } else if (series && chapter) {
      return await app.provider.startAsync(new app.AdaptorCache(seriesId, chapterId), chapter.url);
    } else {
      return;
    }
  }

  async chapterPatchAsync(seriesId: string, chapterId: string, isReadCompleted?: boolean, pageReadNumber?: number) {
    return await this._context.lockSeriesAsync(seriesId, async (seriesContext) => {
      try {
        const series = await seriesContext.getAsync();
        const chapter = series.chapters.find((chapter) => chapter.id === chapterId);
        if (chapter) {
          chapter.isReadCompleted = typeof isReadCompleted === 'boolean' ? isReadCompleted : chapter.isReadCompleted;
          chapter.pageReadNumber = typeof pageReadNumber === 'number' ? pageReadNumber : chapter.pageReadNumber;
          series.lastPageReadAt = Date.now();
          await seriesContext.saveAsync();
          app.core.socket.emit({type: 'ChapterPatch', seriesId, chapterId});
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

  async chapterUpdateAsync(seriesId: string, chapterId: string) {
    const series = await this.seriesReadAsync(seriesId);
    const chapter = series && series.chapters.find((chapter) => chapter.id === chapterId);
    if (series && chapter) {
      await app.provider.startAsync(new app.AdaptorLibrary(this._context, seriesId, chapterId), chapter.url);
      return true;
    } else {
      return false;
    }
  }

  private async _listAsync() {
    if (this._cache) return this._cache;
    this._cache = (await app.core.resource.readdirAsync(app.settings.library)).filter((id) => /^[0-9a-f]{48}$/.test(id));
    return this._cache;
  }
}

function createSeries(remote: app.IRemoteSeries, remoteImage?: Buffer): app.IFileSeries {
  const id = app.createUniqueId();
  const addedAt = Date.now();
  const automation: app.ILibrarySeriesAutomation = {checkedAt: Date.now(), frequency: 'weekly', strategy: 'none'};
  const chapters: app.ILibrarySeriesChapter[] = [];
  const source = createSeriesSource(remote, remoteImage);
  return {id, addedAt, automation, chapters, source};
}

function createSeriesSource(remote: app.IRemoteSeries, remoteImage?: Buffer, source?: app.IFileSeriesSource): app.IFileSeriesSource {
  const authors = remote.authors;
  const genres = remote.genres;
  const image = remoteImage && remoteImage.toString('base64') || (source && source.image);
  const isCompleted = remote.isCompleted;
  const summary = remote.summary;
  const title = remote.title;
  const url = remote.url;
  return {authors, genres, image, isCompleted, summary, title, url};
}

function createSeriesFilter(readStatus: app.IEnumeratorReadStatus, seriesStatus: app.IEnumeratorSeriesStatus, title?: string) {
  return (data: {series: app.ILibrarySeries, unreadCount: number}) => {
    if (readStatus === 'read' && data.unreadCount) return false;
    if (readStatus === 'unread' && !data.unreadCount) return false;
    if (seriesStatus === 'completed' && !data.series.source.isCompleted) return false;
    if (seriesStatus === 'ongoing' && data.series.source.isCompleted) return false;
    if (title && !title.replace(/[^a-z0-9]/ig, ' ').split(/\s+/).filter(Boolean).every((piece) => data.series.source.title.toLocaleLowerCase().includes(piece.toLocaleLowerCase()))) return false;
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

function synchronize(series: app.ILibrarySeries, remotes: app.IRemoteSeriesChapter[]) {
  const ids: {[id: string]: boolean} = {};
  const locals = series.chapters;
  series.chapters = [];
  for (const remote of remotes) {
    const local = locals.find((chapter) => chapter.url === remote.url);
    if (local) {
      local.title = remote.title;
      series.chapters.push(local);
      ids[local.id] = true;
    } else {
      const id = app.createUniqueId();
      series.chapters.push({id, addedAt: Date.now(), title: remote.title, url: remote.url});
      series.lastChapterAddedAt = locals.length ? Date.now() : undefined;
      ids[id] = true;
    }
  }
  for (const local of locals) {
    if (ids[local.id] || !local.syncAt) continue;
    local.deletedAt = local.deletedAt || Date.now();
    series.chapters.push(local);
  }
}
