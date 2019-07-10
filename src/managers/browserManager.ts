import puppeteer from 'puppeteer';
import * as app from '..';
let browser: Promise<puppeteer.Browser> | undefined;
let idleTimeout: NodeJS.Timeout;
let numberOfPages = 0;

export const browserManager = {
  async browserAsync() {
    try {
      if (browser) return browser;
      const headless = app.settings.browserHeadless;
      const userDataDir = app.pathManager.resolve(app.settings.browserCache);
      browser = puppeteer.launch({headless, userDataDir});
      return await browser;
    } catch (error) {
      browser = undefined;
      throw error;
    }
  },

  async pageAsync<T>(handlerAsync: (page: puppeteer.Page) => Promise<T>) {
    let page: puppeteer.Page | undefined;
    try {
      numberOfPages++;
      const browser = await browserManager.browserAsync();
      const userAgent = await browser.userAgent();
      page = await browser.newPage();
      await page.setDefaultTimeout(app.settings.browserNavigationTimeout);
      await page.setUserAgent(userAgent.replace(/HeadlessChrome/g, 'Chrome'));
      await page.setViewport(app.settings.browserViewport);
      return await handlerAsync(page);
    } finally {
      numberOfPages--;
      updateTimeout();
      if (page) await page.close();
    }
  }
};

function updateTimeout() {
  clearTimeout(idleTimeout);
  idleTimeout = setTimeout(async () => {
    const currentBrowser = browser && await browser;
    if (!currentBrowser || numberOfPages) return;
    browser = undefined;
    await currentBrowser.close();
  }, app.settings.browserIdleTimeout);
}
