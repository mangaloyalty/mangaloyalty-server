import * as api from 'express-openapi-json';
import * as app from '..';

export class LibraryController {
  @api.createOperation('LibraryList')
  async listAsync(model: app.ILibraryListContext): Promise<api.Result<app.ILibraryListResponse>> {
    const readStatus = model.query.readStatus;
    const seriesStatus = model.query.seriesStatus;
    const sortKey = model.query.sortKey;
    return api.json(await app.core.library.listAsync(readStatus, seriesStatus, sortKey, model.query.title));
  }

  @api.createOperation('LibrarySeriesCreate')
  async seriesCreateAsync(model: app.ILibrarySeriesCreateContext): Promise<api.Result<app.ILibrarySeriesCreateResponse>> {
    const id = await app.core.library.seriesCreateAsync(model.query.url);
    return api.json({id});
  }

  @api.createOperation('LibrarySeriesDelete')
  async seriesDeleteAsync(model: app.ILibrarySeriesDeleteContext): Promise<api.Result<void>> {
    const success = await app.core.library.seriesDeleteAsync(model.path.seriesId);
    if (success) {
      return api.status(200);
    } else {
      return api.status(404);
    }
  }

  @api.createOperation('LibrarySeriesFindByUrl')
  async seriesFindByUrl(model: app.ILibrarySeriesFindByUrlContext): Promise<api.Result<app.ILibrarySeriesFindByUrlResponse>> {
    const id = await app.core.library.seriesFindByUrlAsync(model.query.url);
    if (id) {
      return api.json({id});
    } else {
      return api.status(404);
    }
  }
  
  @api.createOperation('LibrarySeriesImage', app.cacheOperation(app.settings.imageLibraryTimeout))
  async seriesImageAsync(model: app.ILibrarySeriesImageContext): Promise<api.Result<Buffer>> {
    const image = await app.core.library.seriesImageAsync(model.path.seriesId);
    if (image) {
      return api.buffer(image, app.imageContentType(image));
    } else {
      return api.status(404);
    }
  }

  @api.createOperation('LibrarySeriesRead')
  async seriesReadAsync(model: app.ILibrarySeriesReadContext): Promise<api.Result<app.ILibrarySeriesReadResponse>> {
    const series = await app.core.library.seriesReadAsync(model.path.seriesId);
    if (series) {
      return api.json(series);
    } else {
      return api.status(404);
    }
  }
  
  @api.createOperation('LibrarySeriesPatch')
  async seriesPatchAsync(model: app.ILibrarySeriesPatchContext): Promise<api.Result<void>> {
    const success = await app.core.library.seriesPatchAsync(model.path.seriesId, model.query.frequency, model.query.strategy);
    if (success) {
      return api.status(200);
    } else {
      return api.status(404);
    }
  }

  @api.createOperation('LibrarySeriesUpdate')
  async seriesUpdateAsync(model: app.ILibrarySeriesUpdateContext): Promise<api.Result<void>> {
    const success = await app.core.library.seriesUpdateAsync(model.path.seriesId);
    if (success) {
      return api.status(200);
    } else {
      return api.status(404);
    }
  }

  @api.createOperation('LibraryChapterDelete')
  async chapterDeleteAsync(model: app.ILibraryChapterDeleteContext): Promise<api.Result<void>> {
    const success = await app.core.library.chapterDeleteAsync(model.path.seriesId, model.path.chapterId);
    if (success) {
      return api.status(200);
    } else {
      return api.status(404);
    }
  }

  @api.createOperation('LibraryChapterRead')
  async chapterReadAsync(model: app.ILibraryChapterReadContext): Promise<api.Result<app.ILibraryChapterReadResponse>> {
    const session = await app.core.library.chapterReadAsync(model.path.seriesId, model.path.chapterId);
    if (session) {
      return api.json(session.getData());
    } else {
      return api.status(404);
    }
  }

  @api.createOperation('LibraryChapterPatch')
  async chapterPatchAsync(model: app.ILibraryChapterPatchContext): Promise<api.Result<void>> {
    const success = await app.core.library.chapterPatchAsync(model.path.seriesId, model.path.chapterId, model.query.isReadCompleted, model.query.pageReadNumber);
    if (success) {
      return api.status(200);
    } else {
      return api.status(404);
    }
  }

  @api.createOperation('LibraryChapterUpdate')
  async chapterUpdateAsync(model: app.ILibraryChapterUpdateContext): Promise<api.Result<void>> {
    const success = await app.core.library.chapterUpdateAsync(model.path.seriesId, model.path.chapterId);
    if (success) {
      return api.status(200);
    } else {
      return api.status(404);
    }
  }
}
