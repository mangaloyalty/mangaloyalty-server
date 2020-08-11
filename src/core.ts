import * as app from '.';
let action: app.IActionManager;
let automate: app.IAutomateManager;
let browser: app.IBrowserManager;
let cache: app.ICacheManager;
let library: app.ILibraryManager;
let resource: app.IResourceManager;
let session: app.ISessionManager;
let trace: app.ITraceManager;

export const core = {
  get action() {
    return action || (action = new app.ActionManager());
  },

  get automate() {
    return automate || (automate = new app.AutomateManager());
  },

  get browser() {
    return browser || (browser = new app.BrowserManager());
  },

  get cache() {
    return cache || (cache = new app.CacheManager());
  },
  
  get library() {
    return library || (library = new app.LibraryManager());
  },

  get resource() {
    return resource || (resource = new app.ResourceManager());
  },
  
  get session() {
    return session || (session = new app.SessionManager());
  },

  get trace() {
    return trace || (trace = new app.TraceManager());
  },
  
  set action(value: app.IActionManager) {
    action = value;
  },

  set automate(value: app.IAutomateManager) {
    automate = value;
  },

  set browser(value: app.IBrowserManager) {
    browser = value;
  },

  set cache(value: app.ICacheManager) {
    cache = value;
  },

  set library(value: app.ILibraryManager) {
    library = value;
  },

  set resource(value: app.IResourceManager) {
    resource = value;
  },

  set session(value: app.ISessionManager) {
    session = value;
  },
  
  set trace(value: app.ITraceManager) {
    trace = value;
  }
};
