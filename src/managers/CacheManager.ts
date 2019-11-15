import * as app from '..';
import * as path from 'path';

export class CacheManager {
  private readonly _timeoutHandles: {[key: string]: NodeJS.Timeout};
  private readonly _values: {[key: string]: app.Future<any> | Promise<any> | {id: string, isBuffer: boolean}};

  constructor() {
    this._timeoutHandles = {};
    this._values = {};
  }

  expire(key: string) {
    const value = this._values[key];
    if (value instanceof app.Future) {
      clearTimeout(this._timeoutHandles[key]);
      delete this._timeoutHandles[key];
      delete this._values[key];
      value.reject(new Error());
    } else if (value instanceof Promise) {
      const continueWith = () => expireWithTrace(this, key);
      value.then(continueWith, continueWith);
    } else {
      clearTimeout(this._timeoutHandles[key]);
      delete this._timeoutHandles[key];
      delete this._values[key];
      removeWithTraceAsync(path.join(app.settings.cache, value.id));
    }
  }

  exists(key: string) {
    const value = this._values[key];
    if (value instanceof app.Future) {
      return false;
    } else {
      return Boolean(value);
    }
  }

  async getAsync<T>(key: string, timeout: false | number, valueFactory?: () => Promise<T> | T): Promise<T> {
    const value = this._values[key];
    if (!value) {
      return valueFactory
        ? await this._createAsync(key, timeout, valueFactory())
        : await (this._values[key] = new app.Future()).getAsync();
    } else if (value instanceof app.Future) {
      return valueFactory
        ? await this._createAsync(key, timeout, valueFactory())
        : await value.getAsync();
    } else if (value instanceof Promise) {
      return await value as T;
    } else try {
      return value.isBuffer
        ? await app.core.resource.readFileAsync(path.join(app.settings.cache, value.id)) as any
        : await app.core.resource.readJsonAsync<T>(path.join(app.settings.cache, value.id));
    } catch (error) {
      if (error && error.code === 'ENOENT') return await this.getAsync(key, timeout, valueFactory);
      throw error;
    }
  }

  async setAsync<T>(key: string, timeout: false | number, valueFactory: () => Promise<T> | T) {
    const value = this._values[key];
    if (value && !(value instanceof app.Future)) this.expire(key);
    await this._createAsync(key, timeout, valueFactory());
  }

  private async _createAsync<T>(key: string, timeout: false | number, valuePromise: Promise<T> | T) {
    const previousValue = this._values[key];
    try {
      this._values[key] = Promise.resolve(valuePromise);
      const id = app.createUniqueId();
      const value = await valuePromise;
      if (previousValue instanceof app.Future) previousValue.resolve(value);
      await app.core.resource.writeFileAsync(path.join(app.settings.cache, id), value);
      this._values[key] = {id, isBuffer: Buffer.isBuffer(value)};
      this._updateTimeout(key, timeout);
      return value;
    } catch (error) {
      if (previousValue instanceof app.Future) previousValue.reject(error);
      delete this._values[key];
      throw error;
    }
  }

  private _updateTimeout(key: string, timeout: false | number) {
    if (!timeout) return;
    clearTimeout(this._timeoutHandles[key]);
    this._timeoutHandles[key] = setTimeout(() => this.expire(key), timeout);
  }
}

function expireWithTrace(cache: CacheManager, key: string) {
  try {
    cache.expire(key);
  } catch (error) {
    app.traceError(error);
  }
}

async function removeWithTraceAsync(path: string) {
  try {
    await app.core.resource.removeAsync(path);
  } catch (error) {
    app.traceError(error);
  }
}
