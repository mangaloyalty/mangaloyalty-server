import * as api from 'express-openapi-json';
import * as app from '..';

export class SessionController {
  @api.createOperation('SessionList')
  list(model: app.ISessionListContext): api.Result<app.ISessionListResponse> {
    const seriesId = model.query.seriesId;
    return api.json(app.core.session.getAll(seriesId));
  }

  @api.createOperation('SessionPage')
  async pageAsync(model: app.ISessionPageContext): Promise<api.Result<app.ISessionPageResponse>> {
    const session = app.core.session.get(model.path.sessionId);
    const image = session && await session.getPageAsync(model.query.pageNumber);
    if (image) {
      return api.json(image);
    } else {
      return api.status(404);
    }
  }
}
