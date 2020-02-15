import * as api from 'express-openapi-json';
import * as app from '..';

export class RemoteController {
  @api.createOperation('RemoteImage', app.httpCache(app.settings.imageRemoteTimeout))
  async imageAsync(model: app.IRemoteImageContext): Promise<api.Result<Function>> {
    const image = await app.provider.imageAsync(model.query.imageId);
    if (image) {
      return api.handler(app.httpImage(image));
    } else {
      return api.status(404);
    }
  }

  @api.createOperation('RemotePopular')
  async popularAsync(model: app.IRemotePopularContext): Promise<api.Result<app.IRemotePopularResponse>> {
    const key = `${model.query.providerName}/${model.query.pageNumber || 1}`;
    const timeout = app.settings.cacheDataTimeout;
    return api.json(await app.core.cache.getAsync(key, timeout, () => app.provider.popularAsync(model.query.providerName, model.query.pageNumber)));
  }

  @api.createOperation('RemoteSearch')
  async searchAsync(model: app.IRemoteSearchContext): Promise<api.Result<app.IRemoteSearchResponse>> {
    const key = `${model.query.providerName}/${model.query.title}/${model.query.pageNumber || 1}`;
    const timeout = app.settings.cacheDataTimeout;
    return api.json(await app.core.cache.getAsync(key, timeout, () => app.provider.searchAsync(model.query.providerName, model.query.title, model.query.pageNumber)));
  }

  @api.createOperation('RemoteSeries')
  async seriesAsync(model: app.IRemoteSeriesContext): Promise<api.Result<app.IRemoteSeriesResponse>> {
    const key = model.query.url;
    const timeout = app.settings.cacheDataTimeout;
    return api.json(await app.core.cache.getAsync(key, timeout, () => app.provider.seriesAsync(model.query.url)));
  }

  @api.createOperation('RemoteStart')
  async startAsync(model: app.IRemoteStartContext): Promise<api.Result<app.IRemoteStartResponse>> {
    const session = await app.provider.startAsync(new app.AdaptorCache(), model.query.url);
    return api.json(session.getData());
  }
}
