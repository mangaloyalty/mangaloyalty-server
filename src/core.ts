import * as app from '.';
let automate: app.AutomateManager;
let browser: app.BrowserManager;
let cache: app.CacheManager;
let library: app.LibraryManager;
let resource: app.ResourceManager;
let session: app.SessionManager;
let socket: app.SocketManager;

export const core = {
  get automate() {
    if (automate) return automate;
    automate = new app.AutomateManager();
    return automate;
  },

  get browser() {
    if (browser) return browser;
    browser = new app.BrowserManager();
    return browser;
  },

  get cache() {
    if (cache) return cache;
    cache = new app.CacheManager();
    return cache;
  },
  
  get library() {
    if (library) return library;
    library = new app.LibraryManager();
    return library;
  },

  get resource() {
    if (resource) return resource;
    resource = new app.ResourceManager();
    return resource;
  },
  
  get session() {
    if (session) return session;
    session = new app.SessionManager();
    return session;
  },

  get socket() {
    if (socket) return socket;
    socket = new app.SocketManager();
    return socket;
  }
};
