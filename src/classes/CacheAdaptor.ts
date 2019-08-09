import * as app from '..';

export class CacheAdaptor implements app.IAdaptor {
  private readonly _cache: app.Cache;
  private readonly _cacheId: string;
  private readonly _chapterId?: string;
  private readonly _seriesId?: string;
  
  constructor(cache: app.Cache, seriesId?: string, chapterId?: string) {
    this._cache = cache;
    this._cacheId = app.createUniqueId();
    this._chapterId = chapterId;
    this._seriesId = seriesId;
  }

  get detailLibrary() {
    if (!this._seriesId || !this._chapterId) return;
    const seriesId = this._seriesId;
    const chapterId = this._chapterId;
    const sync = false;
    return {seriesId, chapterId, sync};
  }

  endAsync(pageCount: number) {
    for (let i = 1; i <= pageCount; i++) this._cache.expire(`${this._cacheId}/${i}`);
    return Promise.resolve();
  }

  async getAsync(pageNumber: number) {
    return await this._cache.getAsync<app.ISessionPage>(`${this._cacheId}/${pageNumber}`);
  }

  async setAsync(pageNumber: number, buffer: Buffer) {
    const image = buffer.toString('base64');
    await this._cache.setAsync(`${this._cacheId}/${pageNumber}`, () => ({image}));
  }
  
  successAsync() {
    return Promise.resolve();
  }
}
