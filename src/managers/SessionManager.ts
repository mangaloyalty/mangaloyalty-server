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
    this._values[session.id] = session;
    this._updateTimeout(session.id);
  }

  createWithCache(url: string) {
    const session = new app.Session(this._cache || (this._cache = new app.Cache(app.settings.cacheSessionName)), app.createUniqueId(), url);
    this.add(session);
    return session;
  }

  get(id: string) {
    if (!this._values[id]) return undefined;
    this._updateTimeout(id);
    return this._values[id];
  }

  getAll() {
    return Object.values(this._values)
      .filter((session) => session.isValid)
      .map((session) => session.getData());
  }
  
  private _updateTimeout(id: string) {
    clearTimeout(this._timeouts[id]);
    this._timeouts[id] = setTimeout(() => {
      const session = this._values[id];
      delete this._timeouts[id];
      delete this._values[id];
      expireWithTrace(session);
    }, app.settings.sessionTimeout);
  }
}

async function expireWithTrace(session: app.ISession) {
  try {
    session.expire();
  } catch (error) {
    app.core.error.trace(error);
  }
}
