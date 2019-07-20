import * as app from '..';

export class FutureMap<T> {
  private readonly _results: {[key: string]: app.Future<T>};
  private readonly _timeout: number;
  private _hasReject?: boolean;
  private _reject?: Error;

  constructor(timeout = 0) {
    this._results = {};
    this._timeout = timeout;
  }

  async getAsync(key: string) {
    if (this._hasReject && !this._results[key]) {
      return await Promise.reject(this._reject);
    } else {
      return await this._ensure(key).getAsync();
    }
  }

  reject(error?: Error) {
    if (this._hasReject) return;
    this._hasReject = true;
    this._reject = error;
    Object.values(this._results).forEach((result) => result.reject(error));
  }

  resolve(key: string, result: T) {
    if (this._hasReject) return;
    this._ensure(key).resolve(result);
  }

  private _ensure(key: string) {
    return this._results[key] || (this._results[key] = new app.Future(this._timeout));
  }
}
