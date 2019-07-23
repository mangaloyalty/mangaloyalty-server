import * as api from 'express-openapi-json';
import * as app from '..';

export class RemoteController {
  private readonly _cache: app.Cache;
  
  constructor() {
    this._cache = new app.Cache(app.settings.cacheRemoteName, app.settings.cacheRemoteTimeout);
  }

  @api.createOperation('RemotePopular')
  async popularAsync(model: app.IRemotePopularContext): Promise<api.Result<app.IRemotePopularResponse>> {
    const cacheKey = `${model.query.providerName}/${model.query.pageNumber || 1}`;
    switch (model.query.providerName) {
      case 'batoto':
        return api.json(await this._cache.getAsync(cacheKey, () => app.batotoProvider.popularAsync(model.query.pageNumber)));
      case 'fanfox':
        return api.json(await this._cache.getAsync(cacheKey, () => app.fanfoxProvider.popularAsync(model.query.pageNumber)));
      default:
        throw new Error();
    }
  }

  @api.createOperation('RemoteSearch')
  async searchAsync(model: app.IRemoteSearchContext): Promise<api.Result<app.IRemoteSearchResponse>> {
    const cacheKey = `${model.query.providerName}/${model.query.title}/${model.query.pageNumber || 1}`;
    switch (model.query.providerName) {
      case 'batoto':
        return api.json(await this._cache.getAsync(cacheKey, () => app.batotoProvider.searchAsync(model.query.title, model.query.pageNumber)));
      case 'fanfox':
        return api.json(await this._cache.getAsync(cacheKey, () => app.fanfoxProvider.searchAsync(model.query.title, model.query.pageNumber)));
      default:
        throw new Error();
    }
  }

  @api.createOperation('RemoteSeries')
  async seriesAsync(model: app.IRemoteSeriesContext): Promise<api.Result<app.IRemoteSeriesResponse>> {
    const cacheKey = model.query.url;
    if (app.batotoProvider.isSupported(model.query.url)) {
      return api.json(await this._cache.getAsync(cacheKey, () => app.batotoProvider.seriesAsync(model.query.url)));
    } else if (app.fanfoxProvider.isSupported(model.query.url)) {
      return api.json(await this._cache.getAsync(cacheKey, () => app.fanfoxProvider.seriesAsync(model.query.url)));
    } else {
      throw new Error();
    }
  }

  @api.createOperation('RemoteStart')
  async startAsync(model: app.IRemoteStartContext): Promise<api.Result<app.IRemoteStartResponse>> {
    if (app.batotoProvider.isSupported(model.query.url)) {
      return api.json(await app.batotoProvider.startAsync(new app.CacheAdaptor(app.core.session.getOrCreateCache()), model.query.url));
    } else if (app.fanfoxProvider.isSupported(model.query.url)) {
      return api.json(await app.fanfoxProvider.startAsync(new app.CacheAdaptor(app.core.session.getOrCreateCache()), model.query.url));
    } else {
      throw new Error();
    }
  }
}
