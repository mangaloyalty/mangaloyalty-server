import puppeteer from 'puppeteer';
import * as app from '..';
let browserInstance: Promise<puppeteer.Browser> | undefined;

export const browserManager = {
  browserAsync() {
    if (browserInstance) return browserInstance;
    const headless = app.settings.browserHeadless;
    const userDataDir = app.pathManager.resolve(app.settings.browserCache);
    browserInstance = puppeteer.launch({headless, userDataDir});
    return browserInstance;
  },

  async pageAsync<T>(handlerAsync: (page: puppeteer.Page) => Promise<T>) {
    let page: puppeteer.Page | undefined;
    try {
      const browser = await browserManager.browserAsync();
      const userAgent = await browser.userAgent();
      page = await browser.newPage();
      await page.setDefaultTimeout(app.settings.browserDefaultTimeout);
      await page.setUserAgent(userAgent.replace(/HeadlessChrome/g, 'Chrome'));
      await page.setViewport(app.settings.browserViewport);
      return await handlerAsync(page);
    } finally {
      if (page) await page.close();
    }
  }
};
