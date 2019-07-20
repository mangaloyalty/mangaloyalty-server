import * as app from '..';

export class Session implements app.ISession {
  private readonly _cache: app.Cache;
  private readonly _id: string;
  private readonly _images: app.FutureMap<string>;
  private readonly _isActive: app.Future<void>;
  private readonly _url: string;
  private _hasReject?: boolean;
  private _pageCount?: number;

  constructor(cache: app.Cache, id: string, url: string) {
    this._cache = cache;
    this._id = id;
    this._images = new app.FutureMap();
    this._isActive = new app.Future();
    this._url = url;
  }

  expire(error?: Error) {
    if (this._hasReject) return;
    this._hasReject = true;
    this._images.reject(error);
    this._isActive.reject(error);
    for (let i = 1; i <= (this._pageCount || 0); i++) this._cache.expire(`${this._id}/${i}`);
  }

  getData() {
    const id = this._id;
    const pageCount = this._pageCount || 0;
    const url = this._url;
    return {id, pageCount, url};
  }

  async getImageAsync(pageNumber: number) {
    if (this._hasReject || pageNumber <= 0 || pageNumber > (this._pageCount || 0)) return;
    const key = await this._images.getAsync(String(pageNumber));
    const image = await this._cache.getAsync<string>(key);
    return image;
  }

  get id() {
    return this._id;
  }

  get isValid() {
    return !this._hasReject && Boolean(this._pageCount);
  }

  async setImageAsync(pageNumber: number, image: string) {
    if (this._hasReject || pageNumber <= 0 || pageNumber > (this._pageCount || 0)) return;
    const key = `${this._id}/${pageNumber}`;
    await this._cache.getOrAddAsync(key, () => image);
    this._images.resolve(String(pageNumber), key);
  }

  setPageCount(pageCount: number) {
    if (this._hasReject) return;
    this._pageCount = this._pageCount || pageCount;
    this._isActive.resolve();
  }

  async waitAsync() {
    await this._isActive.getAsync();
    return this.getData();
  }
}
