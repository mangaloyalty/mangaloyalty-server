import * as api from 'express-openapi-json';
import * as app from '..';

export class SessionController {
  @api.createOperation('SessionList')
  sessionList(): api.Result<app.ISessionList> {
    return api.json(app.sessionManager.getAll());
  }

  @api.createOperation('SessionPage')
  async sessionPageAsync(model: app.ISessionPageContext): Promise<api.Result<app.ISessionPage>> {
    const session = app.sessionManager.get(model.path.sessionId);
    if (session) {
      const image = await session.getImageAsync(model.query.pageNumber);
      return api.json({image});
    } else {
      return api.status(404);
    }
  }
}
