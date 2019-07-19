import * as api from 'express-openapi-json';
import * as app from '..';

export class LibraryController {
  @api.createOperation('LibraryAdd')
  async addAsync(model: app.ILibraryAddContext): Promise<api.Result<app.ILibraryAddResponse>> {
    const id = await app.core.library.addAsync(model.query.url);
    return api.json({id});
  }

  @api.createOperation('LibraryDetail')
  async detailAsync(model: app.ILibraryDetailContext): Promise<api.Result<app.ILibraryDetailResponse>> {
    const detail = await app.core.library.detailAsync(model.path.id);
    if (detail) {
      return api.json(detail);
    } else {
      return api.status(404);
    }
  }
  
  @api.createOperation('LibraryList')
  async listAsync(model: app.ILibraryListContext): Promise<api.Result<app.ILibraryListResponse>> {
    return api.json(await app.core.library.listAsync(model.query.pageNumber));
  }
}
