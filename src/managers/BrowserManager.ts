import puppeteer from 'puppeteer-core';
import * as app from '..';
import * as path from 'path';

export class BrowserManager {
  private _browser?: Promise<puppeteer.Browser>;
  private _exclusiveLock: app.ExclusiveLock;
  private _exitTimeoutHandle: NodeJS.Timeout;
  private _numberOfPages: number;

  constructor() {
    this._exclusiveLock = new app.ExclusiveLock();
    this._exitTimeoutHandle = setTimeout(() => undefined, 0);
    this._numberOfPages = 0;
  }

  async pageAsync<T>(handlerAsync: (page: puppeteer.Page) => Promise<T> | T) {
    let page: puppeteer.Page | undefined;
    try {
      this._numberOfPages++;
      const browser = await this._browserAsync();
      const userAgent = await browser.userAgent();
      page = await browser.newPage();
      page.setDefaultTimeout(app.settings.chromeNavigationTimeout);
      await page.setUserAgent(userAgent.replace(/HeadlessChrome/g, 'Chrome'));
      await page.setViewport(app.settings.chromeViewport);
      return await handlerAsync(page);
    } finally {
      this._numberOfPages--;
      this._updateTimeout();
      if (page) await page.close();
    }
  }
  
  async prepareWithTraceAsync() {
    try {
      await this._prepareAsync();
    } catch (error) {
      app.writeError(error);
    }
  }
  
  private async _browserAsync() {
    try {
      if (this._browser) return await this._browser;
      const browserInfo = await this._prepareAsync();
      const executablePath = browserInfo.executablePath;
      const headless = app.settings.chromeHeadless;
      const userDataDir = browserInfo.userDataDir;
      this._browser = puppeteer.launch({executablePath, headless, userDataDir});
      return await this._browser;
    } catch (error) {
      delete this._browser;
      throw error;
    }
  }

  private async _prepareAsync() {
    if (process.env.ML_PUPPETEER_EXECUTABLEPATH && process.env.ML_PUPPETEER_USERDATADIR) {
      const executablePath = process.env.ML_PUPPETEER_EXECUTABLEPATH;
      const userDataDir = process.env.ML_PUPPETEER_USERDATADIR;
      return {executablePath, userDataDir};
    } else return await this._exclusiveLock.acquireAsync(async () => {
      const chromiumRevision = String(require('puppeteer-core/package').puppeteer.chromium_revision);
      const fetcher = puppeteer.createBrowserFetcher({path: app.settings.chrome});
      const revisionInfo = await fetcher.localRevisions();
      await Promise.all(revisionInfo.filter((revision) => chromiumRevision !== revision).map((revision) => fetcher.remove(revision)));
      const downloadInfo = await fetcher.download(chromiumRevision);
      return {executablePath: downloadInfo.executablePath, userDataDir: path.join(downloadInfo.folderPath, app.settings.chromeUserData)};
    });
  }

  private _updateTimeout() {
    clearTimeout(this._exitTimeoutHandle);
    this._exitTimeoutHandle = setTimeout(async () => {
      const browser = await this._browser;
      if (!browser || this._numberOfPages) return;
      delete this._browser;
      closeWithTraceAsync(browser);
    }, app.settings.chromeExitTimeout);
  }
}

async function closeWithTraceAsync(browser: puppeteer.Browser) {
  try {
    await browser.close();
  } catch (error) {
    app.writeError(error);
  }
}
