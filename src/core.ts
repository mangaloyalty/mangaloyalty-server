import {BrowserManager} from './managers/browserManager';
import {ErrorManager} from './managers/errorManager';
import {FileManager} from './managers/fileManager';
import {LibraryManager} from './managers/LibraryManager';
import {SessionManager} from './managers/sessionManager';

export const core = {
  browser: new BrowserManager(),
  error: new ErrorManager(),
  file: new FileManager(),
  library: new LibraryManager(),
  session: new SessionManager()
};
