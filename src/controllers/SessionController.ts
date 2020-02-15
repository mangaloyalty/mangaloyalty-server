import * as api from 'express-openapi-json';
import * as app from '..';

export class SessionController {
  @api.createOperation('SessionList')
  list(model: app.ISessionListContext): api.Result<app.ISessionListResponse> {
    const seriesId = model.query.seriesId;
    return api.json(app.core.session.getAll(seriesId));
  }

  @api.createOperation('SessionPage', app.httpCache(app.settings.imageSessionTimeout))
  async pageAsync(model: app.ISessionPageContext): Promise<api.Result<Function>> {
    const session = app.core.session.get(model.path.sessionId);
    const image = session && await session.getPageAsync(model.query.pageNumber);
    if (image) {
      return api.handler(app.httpImage(image));
    } else {
      return api.status(404);
    }
  }
}
