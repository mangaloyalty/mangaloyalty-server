import * as app from '..';
import * as path from 'path';

// TODO: where will be cache?
// TODO: where will be syncroot? concurrent access on singular series must be protected
export class LibraryManager {
  async createAsync(url: string) {
    const detail = createDetail(await remoteAsync(url));
    const seriesPath = path.join(app.settings.libraryCore, detail.id, app.settings.librarySeriesName);
    await app.core.file.writeJsonAsync(seriesPath, detail);
    return detail.id;
  }

  async deleteAsync(id: string) {
    try {
      const seriesPath = path.join(app.settings.libraryCore, id);
      const deletePath = path.join(app.settings.libraryCore, `_${id}`);
      await app.core.file.moveAsync(seriesPath, deletePath);
      await app.core.file.removeAsync(deletePath);
      return true;
    } catch (error) {
      if (error && error.code === 'ENOENT') return false;
      throw error;
    }
  }

  async detailAsync(id: string) {
    try {
      const seriesPath = path.join(app.settings.libraryCore, id, app.settings.librarySeriesName);
      return await app.core.file.readJsonAsync<app.ILibraryDetail>(seriesPath);
    } catch (error) {
      if (error && error.code === 'ENOENT') return undefined;
      throw error;
    }
  }

  async listAsync(pageNumber?: number) {
    const ids = await app.core.file.readdirAsync(app.settings.libraryCore);
    const seriesPaths = ids.filter((id) => !id.startsWith('_')).map((id) => path.join(app.settings.libraryCore, id, app.settings.librarySeriesName));
    const results = await Promise.all(seriesPaths.map((seriesPath) => app.core.file.readJsonAsync<app.ILibraryDetail>(seriesPath)));
    results.sort((a, b) => (b.lastChapterAddedAt || b.addedAt) - (a.lastChapterAddedAt || a.addedAt));
    return createPageResults(results, pageNumber);
  }

  async updateAsync(id: string) {
    try {
      const seriesPath = path.join(app.settings.libraryCore, id, app.settings.librarySeriesName);
      const detail = await app.core.file.readJsonAsync<app.ILibraryDetail>(seriesPath);
      const remote = await remoteAsync(detail.series.url);
      detail.lastSyncAt = Date.now();
      detail.series = createDetailSeries(remote);
      synchronize(detail, remote);
      await app.core.file.writeJsonAsync(seriesPath, detail);
      return detail;
    } catch (error) {
      if (error && error.code === 'ENOENT') return undefined;
      throw error;
    }
  }
}

function createPageResults(results: app.ILibraryDetail[], pageNumber?: number) {
  const startIndex = ((pageNumber || 1) - 1) * app.settings.librarySeriesPerPage;
  const stopIndex = startIndex + app.settings.librarySeriesPerPage;
  const hasMorePages = results.length > stopIndex;
  const items = results.slice(startIndex, stopIndex).map((detail) => ({id: detail.id, image: detail.series.image, title: detail.series.title}));
  return {hasMorePages, items};
}

function createDetail(detail: app.IRemoteDetail): app.ILibraryDetail {
  const id = app.createUniqueId();
  const result = {id, addedAt: Date.now(), lastSyncAt: Date.now(), chapters: [], series: createDetailSeries(detail)};
  synchronize(result, detail);
  return result;
}

function createDetailSeries(detail: app.IRemoteDetail): app.ILibraryDetailSeries {
  return {
    authors: detail.authors,
    genres: detail.genres,
    image: detail.image,
    isCompleted: detail.isCompleted,
    summary: detail.summary,
    title: detail.title,
    url: detail.url
  };
}

async function remoteAsync(url: string) {
  if (app.batotoProvider.isSupported(url)) {
    return await app.batotoProvider.seriesAsync(url);
  } else if (app.fanfoxProvider.isSupported(url)) {
    return await app.fanfoxProvider.seriesAsync(url);
  } else {
    throw new Error();
  }
}

// TODO: Clean me up
function synchronize(destination: app.ILibraryDetail, source: app.IRemoteDetail) {
  const knownIds: {[id: string]: boolean} = {};

  for (const sourceChapter of source.chapters) {
    const destinationChapter = destination.chapters.find((chapter) => chapter.url === source.url);
    if (destinationChapter) {
      destinationChapter.title = sourceChapter.title;
      knownIds[destinationChapter.id] = true;
    } else {
      const id = app.createUniqueId();
      destination.chapters.push({id, addedAt: Date.now(), title: sourceChapter.title, url: sourceChapter.url});
      knownIds[id] = true;
    }
  }

  // TODO: should I remove non-stored chapters?
  for (const destinationChapter of destination.chapters) {
    if (knownIds[destinationChapter.id]) continue;
    if (!destinationChapter.deletedAt) destinationChapter.deletedAt = Date.now();
  }
}
