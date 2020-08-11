import * as api from 'express-openapi-json';
import * as app from '..';

export class SessionController {
  @api.createOperation('SessionList')
  list(model: app.ISessionListContext): api.Result<app.ISessionListResponse> {
    const seriesId = model.query.seriesId;
    return app.corsContent(app.core.session.getAll(seriesId));
  }

  @api.createOperation('SessionPage')
  async pageAsync(model: app.ISessionPageContext): Promise<api.Result<Buffer>> {
    const session = app.core.session.get(model.path.sessionId);
    const image = session && await session.getPageAsync(model.query.pageNumber);
    if (image) {
      return app.corsImage(image, app.settings.imageSessionTimeout);
    } else {
      return app.corsStatus(404);
    }
  }
}
