import * as api from 'express-openapi-json';
import * as app from '..';

export class RemoteController {
  private readonly _cache = new app.CacheComponent(app.settings.remoteTimeout);

  // TODO: Add pagination indicators (hasMorePages?).
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

  // TODO: Add pagination indicators (hasMorePages?).
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

  // TODO: Add resolved url. Because provider can do redirections, and the library needs to understand that later!
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
      return api.json(await app.batotoProvider.startAsync(model.query.url));
    } else if (app.fanfoxProvider.isSupported(model.query.url)) {
      return api.json(await app.fanfoxProvider.startAsync(model.query.url));
    } else {
      throw new Error();
    }
  }
}
