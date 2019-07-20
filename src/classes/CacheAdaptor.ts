import * as app from '..';

export class CacheAdaptor implements app.IAdaptor {
  private readonly _cache: app.Cache;
  private readonly _id: string;
  
  constructor(cache: app.Cache, id: string) {
    this._cache = cache;
    this._id = id;
  }

  expire(pageNumber: number) {
    this._cache.expire(`${this._id}/${pageNumber}`);
  }

  async getAsync(pageNumber: number) {
    return await this._cache.getAsync<string>(`${this._id}/${pageNumber}`);
  }

  async setAsync(pageNumber: number, value: string) {
    await this._cache.setAsync(`${this._id}/${pageNumber}`, () => value);
  }
  
  successAsync() {
    return Promise.resolve();
  }
}
