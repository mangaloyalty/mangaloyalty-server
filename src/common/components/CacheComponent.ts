export class CacheComponent<T> {
  private readonly _timeout: number;
  private _cacheData?: Promise<T>;
  private _cacheTime?: number;

  constructor(timeout: number) {
    this._timeout = timeout;
  }

  async getAsync(refreshAsync: () => Promise<T>) {
    if (!this._cacheData || !this._cacheTime || this._cacheTime < Date.now()) {
      this._cacheData = refreshAsync();
      this._cacheTime = Date.now() + this._timeout;
      return await this._cacheData;
    } else {
      return await this._cacheData;
    }
  }
}
