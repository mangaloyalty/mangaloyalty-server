import * as api from 'express-openapi-json';
import * as app from '..';

export class LibraryController {
  @api.createOperation('LibraryCreate')
  async createAsync(model: app.ILibraryCreateContext): Promise<api.Result<app.ILibraryCreateResponse>> {
    const id = await app.core.library.createAsync(model.query.url);
    return api.json({id});
  }

  @api.createOperation('LibraryDelete')
  async deleteAsync(model: app.ILibraryDeleteContext): Promise<api.Result<app.ILibraryDetailResponse>> {
    if (await app.core.library.deleteAsync(model.path.id)) {
      return api.status(200);
    } else {
      return api.status(404);
    }
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
