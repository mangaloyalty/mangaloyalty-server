import * as app from '..';
import * as path from 'path';

export class Cache {
  private readonly _basePath: string;
  private readonly _expireTimeout?: number;
  private readonly _timeouts: {[key: string]: NodeJS.Timeout};
  private readonly _values: {[key: string]: app.Future<any> | Promise<any> | string};

  constructor(name: string, timeout?: number) {
    this._basePath = path.join(app.settings.cache, name);
    this._expireTimeout = timeout;
    this._timeouts = {};
    this._values = {};
  }

  expire(key: string) {
    const value = this._values[key];
    if (typeof value === 'string') {
      clearTimeout(this._timeouts[key]);
      delete this._timeouts[key];
      delete this._values[key];
      removeWithTraceAsync(path.join(this._basePath, value));
    } else if (value instanceof app.Future) {
      clearTimeout(this._timeouts[key]);
      delete this._timeouts[key];
      delete this._values[key];
      value.reject(new Error());
    } else if (value) {
      value.then(() => expireWithTrace(this, key));
    }
  }

  async getAsync<T>(key: string, valueFactory?: () => Promise<T> | T): Promise<T> {
    const value = this._values[key];
    if (!value) {
      return valueFactory
        ? await this._createAsync(key, valueFactory())
        : await (this._values[key] = new app.Future()).getAsync() as T;
    } else if (value instanceof app.Future) {
      return valueFactory
        ? await this._createAsync(key, valueFactory())
        : await value.getAsync() as T;
    } else if (typeof value !== 'string') {
      return await value as T;
    } else try {
      return await app.core.system.readJsonAsync<T>(path.join(this._basePath, value));
    } catch (error) {
      if (error && error.code === 'ENOENT') return await this.getAsync(key, valueFactory);
      throw error;
    }
  }

  async setAsync<T>(key: string, valueFactory: () => Promise<T> | T) {
    const value = this._values[key];
    if (value && !(value instanceof app.Future)) this.expire(key);
    await this._createAsync(key, valueFactory());
  }

  private async _createAsync<T>(key: string, valuePromise: Promise<T> | T) {
    const previousValue = this._values[key];
    try {
      this._values[key] = Promise.resolve(valuePromise);
      const id = app.createUniqueId();
      const value = await valuePromise;
      if (previousValue instanceof app.Future) previousValue.resolve(value);
      await app.core.system.writeFileAsync(path.join(this._basePath, id), value);
      this._values[key] = id;
      this._updateTimeout(key);
      return value;
    } catch (error) {
      if (previousValue instanceof app.Future) previousValue.reject(error);
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
    app.traceError(error);
  }
}

async function removeWithTraceAsync(path: string) {
  try {
    await app.core.system.removeAsync(path);
  } catch (error) {
    app.traceError(error);
  }
}
