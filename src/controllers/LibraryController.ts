import * as api from 'express-openapi-json';
import * as app from '..';

export class LibraryController {
  private readonly _service: app.LibraryService;
  
  constructor() {
    this._service = new app.LibraryService();
  }

  @api.createOperation('LibraryCreateSeries')
  async createSeriesAsync(model: app.ILibraryCreateSeriesContext): Promise<api.Result<app.ILibraryCreateSeriesResponse>> {
    return api.json({id: await this._service.addAsync(model.query.url)});
  }
}
