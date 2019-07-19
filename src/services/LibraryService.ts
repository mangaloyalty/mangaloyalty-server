import * as app from '..';
import * as path from 'path';

// LibraryManager? global instance for the library. -> app.core.library.addAsync() etc?
// TODO: where will be cache?
// TODO: where will be syncroot?
export class LibraryService {
  private readonly _currentPath: string;

  constructor() {
    this._currentPath = app.settings.library;
  }

  async addAsync(url: string) {
    const remoteDetail = await remoteAsync(url);
    const libraryDetail = createDetail(remoteDetail);
    synchronize(libraryDetail, remoteDetail);
    await app.core.file.writeJsonAsync(path.join(this._currentPath, libraryDetail.id, 'series.json'), libraryDetail);
    return libraryDetail.id;
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
