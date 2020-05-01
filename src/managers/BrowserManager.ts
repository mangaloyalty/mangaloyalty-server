import puppeteer from 'puppeteer-core';
import * as app from '..';
import * as path from 'path';

export class BrowserManager implements app.IBrowserManager {
  private _browser?: Promise<puppeteer.Browser>;
  private _browserExecutablePath?: string;
  private _browserUserDataDir?: string;
  private _exclusiveLock: app.ExclusiveLock;
  private _exitTimeoutHandle: NodeJS.Timeout;
  private _numberOfPages: number;

  constructor() {
    this._exclusiveLock = new app.ExclusiveLock();
    this._exitTimeoutHandle = setTimeout(() => undefined, 0);
    this._numberOfPages = 0;
  }

  async pageAsync<T>(handlerAsync: (page: app.IBrowserPage) => Promise<T> | T) {
    let page: puppeteer.Page | undefined;
    try {
      this._numberOfPages++;
      const browser = await (this._browser || this._launchAsync());
      const userAgent = await browser.userAgent();
      page = await browser.newPage();
      page.setDefaultTimeout(app.settings.chromeNavigationTimeout);
      await page.setUserAgent(userAgent.replace(/HeadlessChrome/g, 'Chrome'));
      await page.setViewport(app.settings.chromeViewport);
      return await handlerAsync(new app.BrowserPage(page));
    } finally {
      this._numberOfPages--;
      this._updateTimeout();
      if (page) await page.close();
    }
  }
  
  async prepareAsync() {
    if (process.env.ML_PUPPETEER_EXECUTABLEPATH && process.env.ML_PUPPETEER_USERDATADIR) {
      this._browserExecutablePath = process.env.ML_PUPPETEER_EXECUTABLEPATH;
      this._browserUserDataDir = process.env.ML_PUPPETEER_USERDATADIR;
    } else return await this._exclusiveLock.acquireAsync(async () => {
      const chromiumRevision = String(require('puppeteer-core/package').puppeteer.chromium_revision);
      const fetcher = puppeteer.createBrowserFetcher({path: app.settings.chrome});
      const revisionInfo = await fetcher.localRevisions();
      await Promise.all(revisionInfo.filter((revision) => chromiumRevision !== revision).map((revision) => fetcher.remove(revision)));
      const downloadInfo = await fetcher.download(chromiumRevision);
      this._browserExecutablePath = downloadInfo.executablePath;
      this._browserUserDataDir = path.join(downloadInfo.folderPath, app.settings.chromeUserData);
    });
  }
  
  private async _launchAsync() {
    try {
      await this.prepareAsync();
      const executablePath = this._browserExecutablePath;
      const headless = app.settings.chromeHeadless;
      const userDataDir = this._browserUserDataDir;
      this._browser = puppeteer.launch({executablePath, headless, userDataDir});
      return await this._browser;
    } catch (error) {
      delete this._browser;
      throw error;
    }
  }

  private _updateTimeout() {
    clearTimeout(this._exitTimeoutHandle);
    this._exitTimeoutHandle = setTimeout(async () => {
      const browser = await this._browser;
      if (!browser || this._numberOfPages) return;
      delete this._browser;
      browser.close().catch((error) => app.core.trace.error(error));
    }, app.settings.chromeExitTimeout);
  }
}
