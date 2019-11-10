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
      page.setDefaultTimeout(app.settings.browserNavigationTimeout);
      await page.setUserAgent(userAgent.replace(/HeadlessChrome/g, 'Chrome'));
      await page.setViewport(app.settings.browserViewport);
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
      app.traceError(error);
    }
  }
  
  private async _browserAsync() {
    try {
      if (this._browser) return await this._browser;
      const downloadInfo = await this._prepareAsync();
      const executablePath = downloadInfo.executablePath;
      const headless = app.settings.browserHeadless;
      const userDataDir = path.join(downloadInfo.folderPath, app.settings.browserUserData);
      this._browser = puppeteer.launch({executablePath, headless, userDataDir});
      return await this._browser;
    } catch (error) {
      delete this._browser;
      throw error;
    }
  }

  private async _prepareAsync() {
    return await this._exclusiveLock.acquireAsync(async () => {
      const chromiumRevision = String(require('puppeteer-core/package').puppeteer.chromium_revision);
      const fetcher = puppeteer.createBrowserFetcher({path: path.join(app.settings.basePath, app.settings.browser)});
      const fetcherPromise = fetcher.download(chromiumRevision);
      const fetcherRevisions = await fetcher.localRevisions();
      await Promise.all(fetcherRevisions.filter((revision) => chromiumRevision !== revision).map((revision) => fetcher.remove(revision)));
      return fetcherPromise;
    });
  }

  private _updateTimeout() {
    clearTimeout(this._exitTimeoutHandle);
    this._exitTimeoutHandle = setTimeout(async () => {
      const browser = await this._browser;
      if (!browser || this._numberOfPages) return;
      delete this._browser;
      await closeWithTraceAsync(browser);
    }, app.settings.browserExitTimeout);
  }
}

async function closeWithTraceAsync(browser: puppeteer.Browser) {
  try {
    await browser.close();
  } catch (error) {
    app.traceError(error);
  }
}
