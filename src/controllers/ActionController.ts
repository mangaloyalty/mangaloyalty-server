import * as api from 'express-openapi-json';
import * as app from '..';

export class ActionController {
  @api.createOperation('ActionListRead')
  async listAsync(model: app.IActionListReadContext): Promise<api.Result<app.IActionListReadResponse>> {
    let result = app.core.action.get(model.query.previousResponseAt);
    if (result.items.length === 0 && model.query.isLongPolling) result = await app.core.action.waitAsync();
    return app.corsContent(result);
  }
}
