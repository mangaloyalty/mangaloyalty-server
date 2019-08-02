import * as app from '..';

export class FutureMap<T> {
  private readonly _timeout: number;
  private readonly _values: {[key: string]: app.Future<T>};
  private _hasReject?: boolean;
  private _reject?: any;

  constructor(timeout = 0) {
    this._timeout = timeout;
    this._values = {};
  }

  async getAsync(key: string) {
    if (this._hasReject && !this._values[key]) {
      return await Promise.reject(this._reject);
    } else {
      return await this._accessValue(key).getAsync();
    }
  }

  reject(error?: any) {
    if (this._hasReject) return;
    this._hasReject = true;
    this._reject = error || new Error();
    Object.values(this._values).forEach((value) => value.reject(error));
  }

  resolve(key: string, value: T) {
    if (this._hasReject) return;
    this._accessValue(key).resolve(value);
  }

  private _accessValue(key: string) {
    if (this._values[key]) return this._values[key];
    this._values[key] = new app.Future(this._timeout);
    return this._values[key];
  }
}
