import * as app from '..';

export class SessionManager {
  private readonly _timeouts: {[id: string]: NodeJS.Timeout};
  private readonly _values: {[id: string]: app.ISession};
  private _cache?: app.Cache;

  constructor() {
    this._timeouts = {};
    this._values = {};
  }

  add<T extends app.ISession>(session: T) {
    const id = session.getData().id;
    this._values[id] = session;
    this._updateTimeout(id);
    return session;
  }
  
  get(id: string) {
    if (!this._values[id]) return undefined;
    this._updateTimeout(id);
    return this._values[id];
  }

  getAll() {
    return Object.values(this._values)
      .map((session) => session.getData())
      .filter((data) => Boolean(data.pageCount));
  }
  
  getOrCreateCache() {
    return this._ensureCache();
  }

  private _ensureCache() {
    if (this._cache) return this._cache;
    this._cache = new app.Cache(app.settings.cacheSessionName);
    return this._cache;
  }

  private _updateTimeout(id: string) {
    clearTimeout(this._timeouts[id]);
    this._timeouts[id] = setTimeout(() => {
      const session = this._values[id];
      delete this._timeouts[id];
      delete this._values[id];
      expireWithTraceAsync(session);
    }, app.settings.sessionTimeout);
  }
}

async function expireWithTraceAsync(session: app.ISession) {
  try {
    await session.expireAsync();
  } catch (error) {
    app.core.error.trace(error);
  }
}
