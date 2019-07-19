import * as api from 'express-openapi-json';
import * as app from '..';

export class SessionController {
  @api.createOperation('SessionList')
  sessionList(): api.Result<app.ISessionListResponse> {
    return api.json(app.core.session.getAll());
  }

  @api.createOperation('SessionPage')
  async sessionPageAsync(model: app.ISessionPageContext): Promise<api.Result<app.ISessionPageResponse>> {
    const session = app.core.session.get(model.path.sessionId);
    const image = session && await session.getImageAsync(model.query.pageNumber);
    if (image) {
      return api.json({image});
    } else {
      return api.status(404);
    }
  }
}
