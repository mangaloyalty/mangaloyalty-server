import * as app from '..';

// TODO: Rename LibraryLock to a more sensible name; it is not Library-specific anymore.
export class ExclusiveLock {
  private readonly _items: {future: app.Future<any>, handlerAsync: () => any}[];
  private readonly _onDrain?: () => void;
  private _isRunning?: boolean;

  constructor(onDrain?: () => void) {
    this._items = [];
    this._onDrain = onDrain;
  }

  acquireAsync<T>(handlerAsync: () => Promise<T> | T) {
    const future = new app.Future<T>();
    this._items.push({future, handlerAsync});
    this._tryStart();
    return future.getAsync();
  }

  private async _pumpAsync() {
    while (this._isRunning) {
      const item = this._items.shift();
      try {
        if (!item) continue;
        item.future.resolve(await item.handlerAsync());
      } catch (error) {
        if (!item) continue;
        item.future.reject(error);
      } finally {
        if (this._items.length) continue;
        if (this._onDrain) this._onDrain();
        this._isRunning = false;
      }
    }
  }

  private _tryStart() {
    if (this._isRunning) return;
    this._isRunning = true;
    this._pumpAsync();
  }
}
