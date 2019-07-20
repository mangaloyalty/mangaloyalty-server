import * as app from '..';
import * as path from 'path';

export class Cache {
  private readonly _basePath: string;
  private readonly _expireTimeout?: number;
  private readonly _timeouts: {[key: string]: NodeJS.Timeout};
  private readonly _values: {[key: string]: Promise<any> | string};

  constructor(name: string, timeout?: number) {
    this._basePath = path.join(app.settings.cacheCore, name);
    this._expireTimeout = timeout;
    this._timeouts = {};
    this._values = {};
  }

  async addAsync<T>(key: string, value: T) {
    if (this._values[key]) return false;
    await this._createAsync(key, value);
    return true;
  }

  expire(key: string) {
    const value = this._values[key];
    if (typeof value === 'string') {
      clearTimeout(this._timeouts[key]);
      delete this._timeouts[key];
      delete this._values[key];
      removeWithTraceAsync(path.join(this._basePath, value));
    } else if (value) {
      value.then(() => expireWithTrace(this, key));
    }
  }

  async getAsync<T>(key: string) {
    const value = this._values[key];
    if (!value) {
      return undefined;
    } else if (typeof value !== 'string') {
      return await value as T;
    } else try {
      return await app.core.file.readJsonAsync<T>(path.join(this._basePath, value));
    } catch (error) {
      if (error && error.code === 'ENOENT') return undefined;
      throw error;
    }
  }

  async getOrAddAsync<T>(key: string, valueFactory: () => Promise<T> | T) {
    const value = this._values[key];
    if (!value) {
      return await this._createAsync(key, valueFactory());
    } else if (typeof value !== 'string') {
      return await value as T;
    } else try {
      return await app.core.file.readJsonAsync<T>(path.join(this._basePath, value));
    } catch (error) {
      if (error && error.code === 'ENOENT') return await this._createAsync(key, valueFactory());
      throw error;
    }
  }

  private async _createAsync<T>(key: string, value: Promise<T> | T) {
    try {
      const resultPromise = this._values[key] = Promise.resolve(value);
      const result = await resultPromise;
      const id = app.createUniqueId();
      await app.core.file.writeJsonAsync(path.join(this._basePath, id), result);
      this._values[key] = id;
      this._updateTimeout(key);
      return result;
    } catch (error) {
      delete this._values[key];
      throw error;
    }
  }

  private _updateTimeout(key: string) {
    if (!this._expireTimeout) return;
    clearTimeout(this._timeouts[key]);
    this._timeouts[key] = setTimeout(() => this.expire(key), this._expireTimeout);
  }
}

function expireWithTrace(cache: Cache, key: string) {
  try {
    cache.expire(key);
  } catch (error) {
    app.core.error.trace(error);
  }
}

async function removeWithTraceAsync(path: string) {
  try {
    await app.core.file.removeAsync(path);
  } catch (error) {
    app.core.error.trace(error);
  }
}
