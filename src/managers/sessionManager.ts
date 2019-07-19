import * as app from '..';
const timeouts: {[id: string]: NodeJS.Timeout} = {};
const values: {[id: string]: app.Session} = {};

export const sessionManager = {
  add(session: app.Session) {
    if (values[session.id]) throw new Error();
    values[session.id] = session;
    updateTimeout(session.id);
  },

  get(id: string) {
    if (!values[id]) return undefined;
    updateTimeout(id);
    return values[id];
  },

  getAll() {
    return Object.values(values);
  }
};

function updateTimeout(id: string) {
  clearTimeout(timeouts[id]);
  timeouts[id] = setTimeout(() => {
    delete timeouts[id];
    delete values[id];
  }, app.settings.sessionTimeout);
}
