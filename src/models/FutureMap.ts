import * as app from '..';

export class FutureMap<T> {
  private readonly _results: {[key: string]: app.Future<T>};
  private readonly _timeout: number;

  constructor(timeout = 0) {
    this._results = {};
    this._timeout = timeout;
  }

  async getAsync(key: string) {
    return this._ensure(key).getAsync();
  }

  reject(error?: Error) {
    Object.values(this._results).forEach((result) => result.reject(error));
  }

  resolve(key: string, result: T) {
    this._ensure(key).resolve(result);
  }

  private _ensure(key: string) {
    return this._results[key] || (this._results[key] = new app.Future(this._timeout));
  }
}
