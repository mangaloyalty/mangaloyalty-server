import * as app from '..';
import * as path from 'path';

export class Cache {
  private readonly _currentPath: string;
  private readonly _currentTimeout: number;
  private readonly _timeouts: {[key: string]: NodeJS.Timeout};
  private readonly _values: {[key: string]: Promise<any> | string};
  private _initPromise?: Promise<void>;

  constructor(name: string, timeout: number) {
    this._currentPath = path.join(app.settings.cacheCore, name);
    this._currentTimeout = timeout;
    this._timeouts = {};
    this._values = {};
  }

  async getAsync<T>(key: string, refreshAsync: () => Promise<T>) {
    if (!this._values[key]) {
      await this.initAsync();
      return await this._createAsync(key, refreshAsync);
    } else if (typeof this._values[key] !== 'string') {
      return await this._values[key] as T;
    } else try {
      return await app.core.file.readJsonAsync<T>(path.join(this._currentPath, String(this._values[key])));
    } catch (error) {
      if (error && error.code === 'ENOENT') return await this._createAsync(key, refreshAsync);
      throw error;
    }
  }

  async initAsync() {
    try {
      this._initPromise = this._initPromise || app.core.file.deleteAsync(this._currentPath);
      await this._initPromise;
    } catch (error) {
      this._initPromise = undefined;
      throw error;
    }
  }

  private async _createAsync<T>(key: string, refreshAsync: () => Promise<T>) {
    try {
      const valuePromise = this._values[key] = refreshAsync();
      const value = await valuePromise;
      const id = app.createUniqueId();
      await app.core.file.writeJsonAsync(path.join(this._currentPath, id), value);
      this._values[key] = id;
      this._updateTimeout(key, this._currentTimeout);
      return value;
    } catch (error) {
      delete this._values[key];
      throw error;
    }
  }


  private _updateTimeout(key: string, timeout: number) {
    clearTimeout(this._timeouts[key]);
    this._timeouts[key] = setTimeout(() => {
      const id = this._values[key];
      delete this._timeouts[key];
      delete this._values[key];
      cleanAsync(path.join(this._currentPath, String(id)));
    }, timeout);
  }
}

async function cleanAsync(path: string) {
  try {
    await app.core.file.deleteAsync(path);
  } catch (error) {
    app.core.error.trace(error);
  }
}
