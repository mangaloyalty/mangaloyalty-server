import * as app from '..';
const sessions: {[id: number]: app.SessionComponent} = {};
const timeouts: {[id: number]: NodeJS.Timeout} = {};
const totalTimeout = 20 * 60000;

export const sessionManager = {
  add(session: app.SessionComponent) {
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
  }, totalTimeout);
}
