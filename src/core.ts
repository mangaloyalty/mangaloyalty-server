import {AutomateManager} from './managers/AutomateManager';
import {BrowserManager} from './managers/BrowserManager';
import {LibraryManager} from './managers/LibraryManager';
import {SessionManager} from './managers/SessionManager';
import {SystemManager} from './managers/SystemManager';

export const core = {
  automate: new AutomateManager(),
  browser: new BrowserManager(),
  library: new LibraryManager(),
  session: new SessionManager(),
  system: new SystemManager()
};
