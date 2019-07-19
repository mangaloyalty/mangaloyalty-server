import * as app from '..';

export class SessionManager {
  private _timeouts: {[id: string]: NodeJS.Timeout};
  private _values: {[id: string]: app.Session};

  constructor() {
    this._timeouts = {};
    this._values = {};
  }

  add(session: app.Session) {
    if (this._values[session.id]) throw new Error();
    this._values[session.id] = session;
    this._updateTimeout(session.id);
  }

  get(id: string) {
    if (!this._values[id]) return undefined;
    this._updateTimeout(id);
    return this._values[id];
  }

  getAll() {
    return Object.values(this._values);
  }
  
  private _updateTimeout(id: string) {
    clearTimeout(this._timeouts[id]);
    this._timeouts[id] = setTimeout(() => {
      delete this._timeouts[id];
      delete this._values[id];
    }, app.settings.sessionTimeout);
  }
}
