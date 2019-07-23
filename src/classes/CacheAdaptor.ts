import * as app from '..';

export class CacheAdaptor implements app.IAdaptor {
  private readonly _cache: app.Cache;
  private readonly _id: string;
  
  constructor(cache: app.Cache) {
    this._cache = cache;
    this._id = app.createUniqueId();
  }

  expireAsync(pageCount: number) {
    for (let i = 1; i <= pageCount; i++) this._cache.expire(`${this._id}/${i}`);
    return Promise.resolve();
  }

  async getAsync(pageNumber: number) {
    return await this._cache.getAsync<app.ISessionPage>(`${this._id}/${pageNumber}`);
  }

  async setAsync(pageNumber: number, page: app.ISessionPage) {
    await this._cache.setAsync(`${this._id}/${pageNumber}`, () => page);
  }
  
  successAsync() {
    return Promise.resolve();
  }
}
