import * as api from 'express-openapi-json';
import * as app from '..';

export class LibraryController {
  @api.createOperation('LibraryListRead')
  async listReadAsync(model: app.ILibraryListReadContext): Promise<api.Result<app.ILibraryListReadResponse>> {
    const readStatus = model.query.readStatus;
    const seriesStatus = model.query.seriesStatus;
    const sortKey = model.query.sortKey;
    return app.corsContent(await app.core.library.listReadAsync(readStatus, seriesStatus, sortKey, model.query.title));
  }

  @api.createOperation('LibraryListPatch')
  async listPatchAsync(model: app.ILibraryListPatchContext): Promise<api.Result<void>> {
    await app.core.library.listPatchAsync(model.query.frequency, model.query.strategy);
    return app.corsStatus(200);
  }

  @api.createOperation('LibrarySeriesCreate')
  async seriesCreateAsync(model: app.ILibrarySeriesCreateContext): Promise<api.Result<app.ILibrarySeriesCreateResponse>> {
    const id = await app.core.library.seriesCreateAsync(model.query.url);
    return app.corsContent({id});
  }

  @api.createOperation('LibrarySeriesDelete')
  async seriesDeleteAsync(model: app.ILibrarySeriesDeleteContext): Promise<api.Result<void>> {
    const success = await app.core.library.seriesDeleteAsync(model.path.seriesId);
    if (success) {
      return app.corsStatus(200);
    } else {
      return app.corsStatus(404);
    }
  }
    
  @api.createOperation('LibrarySeriesDump')
  async seriesDumpAsync(model: app.ILibrarySeriesDumpContext): Promise<api.Result<Function>> {
    const series = await app.core.library.seriesReadAsync(model.path.seriesId);
    if (series) {
      const contentDisposition = `attachment; filename="${series.source.title}.zip"`;
      const contentType = 'application/zip';
      return app.corsContent(createHandler(model.path.seriesId), 200, {'Content-Disposition': contentDisposition, 'Content-Type': contentType});
    } else {
      return app.corsStatus(404);
    }
  }

  @api.createOperation('LibrarySeriesImage')
  async seriesImageAsync(model: app.ILibrarySeriesImageContext): Promise<api.Result<Buffer>> {
    const image = await app.core.library.seriesImageAsync(model.path.seriesId);
    if (image) {
      return app.corsImage(image, app.settings.imageLibraryTimeout);
    } else {
      return app.corsStatus(404);
    }
  }

  @api.createOperation('LibrarySeriesRead')
  async seriesReadAsync(model: app.ILibrarySeriesReadContext): Promise<api.Result<app.ILibrarySeriesReadResponse>> {
    const series = await app.core.library.seriesReadAsync(model.path.seriesId);
    if (series) {
      return app.corsContent(series);
    } else {
      return app.corsStatus(404);
    }
  }
  
  @api.createOperation('LibrarySeriesPatch')
  async seriesPatchAsync(model: app.ILibrarySeriesPatchContext): Promise<api.Result<void>> {
    const success = await app.core.library.seriesPatchAsync(model.path.seriesId, model.query.frequency, model.query.strategy);
    if (success) {
      return app.corsStatus(200);
    } else {
      return app.corsStatus(404);
    }
  }

  @api.createOperation('LibrarySeriesUpdate')
  async seriesUpdateAsync(model: app.ILibrarySeriesUpdateContext): Promise<api.Result<void>> {
    const success = await app.core.library.seriesUpdateAsync(model.path.seriesId);
    if (success) {
      return app.corsStatus(200);
    } else {
      return app.corsStatus(404);
    }
  }

  @api.createOperation('LibraryChapterDelete')
  async chapterDeleteAsync(model: app.ILibraryChapterDeleteContext): Promise<api.Result<void>> {
    const success = await app.core.library.chapterDeleteAsync(model.path.seriesId, model.path.chapterId);
    if (success) {
      return app.corsStatus(200);
    } else {
      return app.corsStatus(404);
    }
  }

  @api.createOperation('LibraryChapterRead')
  async chapterReadAsync(model: app.ILibraryChapterReadContext): Promise<api.Result<app.ILibraryChapterReadResponse>> {
    const session = await app.core.library.chapterReadAsync(model.path.seriesId, model.path.chapterId);
    if (session) {
      return app.corsContent(session.getData());
    } else {
      return app.corsStatus(404);
    }
  }

  @api.createOperation('LibraryChapterPatch')
  async chapterPatchAsync(model: app.ILibraryChapterPatchContext): Promise<api.Result<void>> {
    const success = await app.core.library.chapterPatchAsync(model.path.seriesId, model.path.chapterId, model.query.isReadCompleted, model.query.pageReadNumber);
    if (success) {
      return app.corsStatus(200);
    } else {
      return app.corsStatus(404);
    }
  }

  @api.createOperation('LibraryChapterUpdate')
  async chapterUpdateAsync(model: app.ILibraryChapterUpdateContext): Promise<api.Result<void>> {
    const success = await app.core.library.chapterUpdateAsync(model.path.seriesId, model.path.chapterId);
    if (success) {
      return app.corsStatus(200);
    } else {
      return app.corsStatus(404);
    }
  }
}

function createHandler(seriesId: string) {
  return async (_: any, stream: NodeJS.WritableStream) => {
    try {
      await app.core.library.seriesDumpAsync(seriesId, stream);
    } catch (error) {
      app.core.trace.error(error);
      throw error;
    }
  };
}
