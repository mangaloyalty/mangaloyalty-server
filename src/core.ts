import * as app from '.';

export const core = {
  browser: new app.BrowserManager(),
  error: new app.ErrorManager(),
  file: new app.FileManager(),
  session: new app.SessionManager()
};
