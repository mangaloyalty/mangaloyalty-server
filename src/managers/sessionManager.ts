import * as app from '..';
const sessions: {[id: number]: app.Session} = {};
const timeouts: {[id: number]: NodeJS.Timeout} = {};

export const sessionManager = {
  add(session: app.Session) {
    if (sessions[session.id]) throw new Error();
    sessions[session.id] = session;
    updateTimeout(session.id);
  },

  get(id: number) {
    if (!sessions[id]) return undefined;
    updateTimeout(id);
    return sessions[id];
  },

  getAll() {
    return Object.values(sessions);
  }
};

function updateTimeout(id: number) {
  clearTimeout(timeouts[id]);
  timeouts[id] = setTimeout(() => {
    delete sessions[id];
    delete timeouts[id];
  }, app.settings.sessionTimeout);
}
