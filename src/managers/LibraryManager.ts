import * as app from '..';
import * as path from 'path';

// TODO: where will be cache?
// TODO: where will be syncroot? concurrent access on singular series must be protected
export class LibraryManager {
  async addAsync(url: string) {
    const remoteDetail = await remoteAsync(url);
    const libraryDetail = createDetail(remoteDetail);
    synchronize(libraryDetail, remoteDetail);
    await app.core.file.writeJsonAsync(getPath(libraryDetail.id), libraryDetail);
    return libraryDetail.id;
  }

  async detailAsync(id: string) {
    try {
      return await app.core.file.readJsonAsync<app.ILibraryDetail>(getPath(id));
    } catch (error) {
      if (error && error.code === 'ENOENT') return undefined;
      throw error;
    }
  }

  async listAsync(pageNumber?: number) {
    // Initialize the series details.
    const ids = await app.core.file.readdirAsync(app.settings.library);
    const details = await Promise.all(ids.map((id) => app.core.file.readJsonAsync<app.ILibraryDetail>(getPath(id))));
    details.sort((a, b) => (b.lastChapterAddedAt || b.addedAt) - (a.lastChapterAddedAt || a.addedAt));

    // Initialize the series view.
    const startIndex = (pageNumber || 1 - 1) * app.settings.librarySeriesPerPage;
    const stopIndex = startIndex + app.settings.librarySeriesPerPage;
    const hasMorePages = details.length > stopIndex;
    const items = details.slice(startIndex, stopIndex).map((detail) => ({id: detail.id, image: detail.series.image, title: detail.series.title}));
    return {hasMorePages, items};
  }
}

function createDetail(detail: app.IRemoteDetail): app.ILibraryDetail {
  return {
    id: app.createUniqueId(),
    addedAt: Date.now(),
    lastSyncAt: Date.now(),
    chapters: [],
    series: createDetailSeries(detail)
  };
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

function getPath(id: string) {
  return path.join(app.settings.library, id, 'series.json');
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
function synchronize(db: app.ILibraryDetail, remoteDetail: app.IRemoteDetail) {
  const knownIds: {[id: string]: boolean} = {};

  for (const remoteDetailChapter of remoteDetail.chapters) {
    const libraryDetailChapter = db.chapters.find((chapter) => chapter.url === remoteDetail.url);
    if (libraryDetailChapter) {
      libraryDetailChapter.title = remoteDetailChapter.title;
      knownIds[libraryDetailChapter.id] = true;
    } else {
      const id = app.createUniqueId();
      db.chapters.push({id, addedAt: Date.now(), title: remoteDetailChapter.title, url: remoteDetailChapter.url});
      knownIds[id] = true;
    }
  }

  // TODO: should I remove non-stored chapters?
  for (const libraryDetailChapter of db.chapters) {
    if (knownIds[libraryDetailChapter.id]) continue;
    if (!libraryDetailChapter.deletedAt) libraryDetailChapter.deletedAt = Date.now();
  }
}
