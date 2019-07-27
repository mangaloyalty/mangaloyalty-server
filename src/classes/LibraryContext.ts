import * as app from '..';

export class LibraryContext {
  private _main: app.LibraryLock;
  private _series: {[seriesId: string]: {context: app.LibraryContextSeries, lock: app.LibraryLock}};

  constructor() {
    this._main = new app.LibraryLock();
    this._series = {};
  }

  async lockMainAsync<T>(handlerAsync: () => Promise<T> | T) {
    return this._main.acquireAsync(handlerAsync);
  }

  async lockSeriesAsync<T>(seriesId: string, handlerAsync: (seriesContext: app.LibraryContextSeries) => Promise<T> | T) {
    if (this._series[seriesId]) return this._series[seriesId].lock.acquireAsync(() => handlerAsync(this._series[seriesId].context));
    const context = new app.LibraryContextSeries(() => delete this._series[seriesId], seriesId);
    const lock = new app.LibraryLock();
    this._series[seriesId] = {context, lock};
    return this._series[seriesId].lock.acquireAsync(() => handlerAsync(this._series[seriesId].context));
  }
}
