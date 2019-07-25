import * as api from 'express-openapi-json';
import * as app from '..';

export class RemoteController {
  private readonly _cache: app.Cache;
  
  constructor() {
    this._cache = new app.Cache(app.settings.cacheRemote, app.settings.cacheRemoteTimeout);
  }

  @api.createOperation('RemotePopular')
  async popularAsync(model: app.IRemotePopularContext): Promise<api.Result<app.IRemotePopularResponse>> {
    const cacheKey = `${model.query.providerName}/${model.query.pageNumber || 1}`;
    return api.json(await this._cache.getAsync(cacheKey, () => app.provider.popularAsync(model.query.providerName, model.query.pageNumber)));
  }

  @api.createOperation('RemoteSearch')
  async searchAsync(model: app.IRemoteSearchContext): Promise<api.Result<app.IRemoteSearchResponse>> {
    const cacheKey = `${model.query.providerName}/${model.query.title}/${model.query.pageNumber || 1}`;
    return api.json(await this._cache.getAsync(cacheKey, () => app.provider.searchAsync(model.query.providerName, model.query.title, model.query.pageNumber)));
  }

  @api.createOperation('RemoteSeries')
  async seriesAsync(model: app.IRemoteSeriesContext): Promise<api.Result<app.IRemoteSeriesResponse>> {
    const cacheKey = model.query.url;
    return api.json(await this._cache.getAsync(cacheKey, () => app.provider.seriesAsync(model.query.url)));
  }

  @api.createOperation('RemoteStart')
  async startAsync(model: app.IRemoteStartContext): Promise<api.Result<app.IRemoteStartResponse>> {
    return api.json(await app.provider.startAsync(new app.CacheAdaptor(app.core.session.getOrCreateCache()), model.query.url));
  }
}
