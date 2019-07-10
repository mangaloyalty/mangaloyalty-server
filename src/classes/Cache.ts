import * as app from '..';
import * as path from 'path';
import {randomBytes} from 'crypto';

export class Cache {
  private readonly _currentPath: string;
  private readonly _currentTimeout: number;
  private readonly _ids: {[id: string]: string | number};
  private readonly _timeouts: {[id: string]: NodeJS.Timeout};
  private readonly _values: {[key: string]: Promise<any> | string};
  private _initPromise?: Promise<void>;

  constructor(name: string, timeout: number) {
    this._currentPath = path.join(app.settings.cacheCoreName, name);
    this._currentTimeout = timeout;
    this._ids = {};
    this._timeouts = {};
    this._values = {};
  }

  async getAsync<T>(key: string, refreshAsync: () => Promise<T>) {
    if (this._values[key]) {
      await this.initAsync();
      return await this._fetchAsync<T>(this._values[key]);
    } else {
      await this.initAsync();
      return await this._createAsync(key, refreshAsync);
    }
  }

  async initAsync() {
    try {
      this._initPromise = this._initPromise || app.fileManager.deleteAsync(this._currentPath);
      await this._initPromise;
    } catch (error) {
      this._initPromise = undefined;
      throw error;
    }
  }

  private async _createAsync<T>(key: string, refreshAsync: () => Promise<T>) {
    const id = this._spawnUniqueId();
    const valuePromise = refreshAsync();
    try {
      this._ids[id] = key;
      this._values[key] = valuePromise;
      const value = await valuePromise;
      await app.fileManager.writeJsonAsync(path.join(this._currentPath, id), value);
      this._values[key] = id;
      this._updateTimeout(id, this._currentTimeout);
      return value;
    } catch (error) {
      delete this._ids[id];
      delete this._values[key];
      throw error;
    }
  }

  private async _fetchAsync<T>(idOrValue: Promise<any> | string) {
    if (typeof idOrValue === 'string') {
      return await app.fileManager.readJsonAsync<T>(path.join(this._currentPath, idOrValue));
    } else {
      return await idOrValue as T;
    }
  }

  private async _removeAsync(id: string) {
    try {
      clearTimeout(this._timeouts[id]);
      delete this._values[this._ids[id]];
      delete this._timeouts[id];
      delete this._ids[id];
      await app.fileManager.deleteAsync(path.join(this._currentPath, id));
    } catch (error) {
      this._ids[id] = Math.random();
      this._updateTimeout(id, app.settings.cacheCoreTimeout);
    }
  }

  private _spawnUniqueId() {
    while (true) {
      const id = randomBytes(16).toString('hex');
      if (this._ids[id]) continue;
      return id;
    }
  }

  private _updateTimeout(id: string, timeout: number) {
    clearTimeout(this._timeouts[id]);
    this._timeouts[id] = setTimeout(() => this._removeAsync(id).catch(() => {}), timeout);
  }
}
