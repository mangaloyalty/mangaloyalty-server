import * as app from '..';

export class LibraryContext {
  private _mainLock: app.ExclusiveLock;
  private _series: {[seriesId: string]: {context: app.LibraryContextSeries, exclusiveLock: app.ExclusiveLock}};

  constructor() {
    this._mainLock = new app.ExclusiveLock();
    this._series = {};
  }

  async lockMainAsync<T>(handlerAsync: () => Promise<T> | T) {
    return this._mainLock.acquireAsync(handlerAsync);
  }

  async lockSeriesAsync<T>(seriesId: string, handlerAsync: (seriesContext: app.LibraryContextSeries) => Promise<T> | T) {
    if (this._series[seriesId]) return this._series[seriesId].exclusiveLock.acquireAsync(() => handlerAsync(this._series[seriesId].context));
    const context = new app.LibraryContextSeries(() => delete this._series[seriesId], seriesId);
    const exclusiveLock = new app.ExclusiveLock();
    this._series[seriesId] = {context, exclusiveLock};
    return this._series[seriesId].exclusiveLock.acquireAsync(() => handlerAsync(this._series[seriesId].context));
  }
}
