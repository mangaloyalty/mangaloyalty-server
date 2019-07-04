// TECH: Use a setTimeout to let the data expire automatically to clear up memory.
export class Cache {
  private readonly _timeout: number;
  private _cacheData: {[key: string]: Promise<any>};
  private _cacheTime: {[key: string]: number};

  constructor(timeout: number) {
    this._cacheData = {};
    this._cacheTime = {};
    this._timeout = timeout;
  }

  async getAsync<T>(key: string, refreshAsync: () => Promise<T>) {
    try {
      if (this._cacheData[key] && this._cacheTime[key] && this._cacheTime[key] >= Date.now()) return this._cacheData[key];
      this._cacheData[key] = refreshAsync();
      this._cacheTime[key] = Date.now() + this._timeout;
      return await this._cacheData[key];
    } catch (error) {
      delete this._cacheData[key];
      delete this._cacheTime[key];
      throw error;
    }
  }
}
