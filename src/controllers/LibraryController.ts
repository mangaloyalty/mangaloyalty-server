import * as api from 'express-openapi-json';
import * as app from '..';

// TODO: Add cache to listAsync. Make sure mutations clean the cache.
export class LibraryController {
  @api.createOperation('LibraryList')
  async listAsync(model: app.ILibraryListContext): Promise<api.Result<app.ILibraryListResponse>> {
    return api.json(await app.core.library.listAsync(model.query.pageNumber));
  }

  @api.createOperation('LibrarySeriesCreate')
  async seriesCreateAsync(model: app.ILibrarySeriesCreateContext): Promise<api.Result<app.ILibrarySeriesCreateResponse>> {
    const id = await app.core.library.seriesCreateAsync(model.query.url);
    return api.json({id});
  }

  @api.createOperation('LibrarySeriesDelete')
  async seriesDeleteAsync(model: app.ILibrarySeriesDeleteContext): Promise<api.Result<app.ILibrarySeriesDetailResponse>> {
    const success = await app.core.library.seriesDeleteAsync(model.path.seriesId);
    if (success) {
      return api.status(200);
    } else {
      return api.status(404);
    }
  }

  @api.createOperation('LibrarySeriesDetail')
  async seriesDetailAsync(model: app.ILibrarySeriesDetailContext): Promise<api.Result<app.ILibrarySeriesDetailResponse>> {
    const detail = await app.core.library.seriesDetailAsync(model.path.seriesId);
    if (detail) {
      return api.json(detail);
    } else {
      return api.status(404);
    }
  }
  
  @api.createOperation('LibrarySeriesUpdate')
  async seriesUpdateAsync(model: app.ILibrarySeriesUpdateContext): Promise<api.Result<app.ILibrarySeriesUpdateResponse>> {
    const detail = await app.core.library.seriesUpdateAsync(model.path.seriesId);
    if (detail) {
      return api.json(detail);
    } else {
      return api.status(404);
    }
  }

  @api.createOperation('LibraryChapterRead')
  async chapterOpenAsync(model: app.ILibraryChapterReadContext): Promise<api.Result<app.ILibraryChapterReadResponse>> {
    const session = await app.core.library.chapterReadAsync(model.path.seriesId, model.path.chapterId);
    if (session) {
      return api.json(session);
    } else {
      return api.status(404);
    }
  }

  @api.createOperation('LibraryChapterUpdate')
  async chapterUpdateAsync(model: app.ILibraryChapterUpdateContext): Promise<api.Result<app.ILibraryChapterUpdateResponse>> {
    const session = await app.core.library.chapterUpdateAsync(model.path.seriesId, model.path.chapterId);
    if (session) {
      return api.json(session);
    } else {
      return api.status(404);
    }
  }
}
