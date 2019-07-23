import * as app from '..';

export class LibraryContext {
  private _main: app.LibraryLock;
  private _series: {[seriesId: string]: app.LibraryLock};

  constructor() {
    this._main = new app.LibraryLock();
    this._series = {};
  }

  async lockMainAsync<T>(handlerAsync: () => Promise<T> | T) {
    return this._main.acquireAsync(handlerAsync);
  }

  async lockSeriesAsync<T>(seriesId: string, handlerAsync: () => Promise<T> | T) {
    if (this._series[seriesId]) return await this._series[seriesId].acquireAsync(handlerAsync);
    this._series[seriesId] = new app.LibraryLock(() => delete this._series[seriesId]);
    return await this._series[seriesId].acquireAsync(handlerAsync);
  }
}
