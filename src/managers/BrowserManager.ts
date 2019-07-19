import puppeteer from 'puppeteer';
import * as app from '..';
import * as path from 'path';

export class BrowserManager {
  private _browser?: Promise<puppeteer.Browser>;
  private _exitTimeout: NodeJS.Timeout;
  private _numberOfPages: number;

  constructor() {
    this._exitTimeout = setTimeout(() => {}, 0);
    this._numberOfPages = 0;
  }

  async pageAsync<T>(handlerAsync: (page: puppeteer.Page) => Promise<T>) {
    let page: puppeteer.Page | undefined;
    try {
      this._numberOfPages++;
      const browser = await this._browserAsync();
      const userAgent = await browser.userAgent();
      page = await browser.newPage();
      await page.setDefaultTimeout(app.settings.browserNavigationTimeout);
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
      const headless = app.settings.browserHeadless;
      const userDataDir = path.join(app.settings.basePath, app.settings.browserCache);
      this._browser = puppeteer.launch({headless, userDataDir});
      return await this._browser;
    } catch (error) {
      this._browser = undefined;
      throw error;
    }
  }

  private _updateTimeout() {
    clearTimeout(this._exitTimeout);
    this._exitTimeout = setTimeout(async () => {
      const browser = await this._browser;
      if (!browser || this._numberOfPages) return;
      this._browser = undefined;
      await cleanAsync(browser);
    }, app.settings.browserExitTimeout);
  }
}

async function cleanAsync(browser: puppeteer.Browser) {
  try {
    await browser.close();
  } catch (error) {
    app.core.error.trace(error);
  }
}
