import * as app from '.';
let cacheAutomate: app.AutomateManager;
let cacheBrowser: app.BrowserManager;
let cacheLibrary: app.LibraryManager;
let cacheSession: app.SessionManager;
let cacheSocket: app.SocketManager;
let cacheSystem: app.SystemManager;

export const core = {
  get automate() {
    if (cacheAutomate) return cacheAutomate;
    cacheAutomate = new app.AutomateManager();
    return cacheAutomate;
  },

  get browser() {
    if (cacheBrowser) return cacheBrowser;
    cacheBrowser = new app.BrowserManager();
    return cacheBrowser;
  },

  get library() {
    if (cacheLibrary) return cacheLibrary;
    cacheLibrary = new app.LibraryManager();
    return cacheLibrary;
  },

  get session() {
    if (cacheSession) return cacheSession;
    cacheSession = new app.SessionManager();
    return cacheSession;
  },

  get socket() {
    if (cacheSocket) return cacheSocket;
    cacheSocket = new app.SocketManager();
    return cacheSocket;
  },

  get system() {
    if (cacheSystem) return cacheSystem;
    cacheSystem = new app.SystemManager();
    return cacheSystem;
  }
};
