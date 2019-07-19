import * as api from 'express-openapi-json';
import * as app from '..';

export class LibraryController {
  @api.createOperation('LibraryCreateSeries')
  async createSeriesAsync(model: app.ILibraryCreateSeriesContext): Promise<api.Result<app.ILibraryCreateSeriesResponse>> {
    return api.json({id: await app.core.library.addAsync(model.query.url)});
  }
}
