import * as app from '..';

export class SessionManager {
  private readonly _timeoutHandles: {[id: string]: NodeJS.Timeout};
  private readonly _values: {[id: string]: app.ISession};

  constructor() {
    this._timeoutHandles = {};
    this._values = {};
  }

  add<T extends app.ISession>(session: T) {
    const sessionData = session.getData();
    this._values[sessionData.id] = session;
    this._updateTimeout(sessionData.id);
    app.core.socket.emit({type: 'SessionCreate', session: sessionData});
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
  
  private _updateTimeout(id: string) {
    clearTimeout(this._timeoutHandles[id]);
    this._timeoutHandles[id] = setTimeout(() => {
      const session = this._values[id];
      delete this._timeoutHandles[id];
      delete this._values[id];
      endWithTraceAsync(session);
    }, app.settings.sessionTimeout);
  }
}

async function endWithTraceAsync(session: app.ISession) {
  try {
    await session.endAsync();
  } catch (error) {
    app.traceError(error);
  } finally {
    app.core.socket.emit({type: 'SessionDelete', session: session.getData()});
  }
}
