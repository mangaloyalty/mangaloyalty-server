import puppeteer from 'puppeteer';
import * as app from '..';
import * as path from 'path';

export class BrowserManager {
  private _browser?: Promise<puppeteer.Browser>;
  private _exitTimeoutHandle: NodeJS.Timeout;
  private _numberOfPages: number;

  constructor() {
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
  
  private async _browserAsync() {
    try {
      if (this._browser) return this._browser;
      const executablePath = puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked');
      const headless = app.settings.browserHeadless;
      const userDataDir = path.join(app.settings.basePath, app.settings.browser);
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
