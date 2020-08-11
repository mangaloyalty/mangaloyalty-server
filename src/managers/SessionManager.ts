import * as app from '..';

export class SessionManager implements app.ISessionManager {
  private readonly _timeoutHandles: {[id: string]: NodeJS.Timeout};
  private readonly _values: {[id: string]: app.ISession};

  constructor() {
    this._timeoutHandles = {};
    this._values = {};
  }

  add<T extends app.ISession>(session: T) {
    const sessionId = session.getData().id;
    this._values[sessionId] = session;
    this._updateTimeout(sessionId);
    app.core.action.emit(Object.assign({type: <'SessionCreate'>'SessionCreate', sessionId}, session.getData().library));
    return session;
  }
  
  get(id: string) {
    if (!this._values[id]) return;
    this._updateTimeout(id);
    return this._values[id];
  }

  getAll(seriesId?: string) {
    return Object.values(this._values)
      .map((session) => session.getData())
      .filter((data) => Boolean(data.pageCount))
      .filter((data) => !seriesId || (data.library && data.library.seriesId === seriesId));
  }
  
  private _updateTimeout(sessionId: string) {
    clearTimeout(this._timeoutHandles[sessionId]);
    this._timeoutHandles[sessionId] = setTimeout(() => {
      const session = this._values[sessionId];
      delete this._timeoutHandles[sessionId];
      delete this._values[sessionId];
      app.core.action.emit(Object.assign({type: <'SessionDelete'>'SessionDelete', sessionId}, session.getData().library));
      session.endAsync().catch((error) => app.core.trace.error(error));
    }, app.settings.sessionTimeout);
  }
}
