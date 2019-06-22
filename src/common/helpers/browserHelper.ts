import puppeteer from 'puppeteer';
import * as app from '../..';
let browserInstance: Promise<puppeteer.Browser> | undefined;

export const browserHelper = {
  browserAsync() {
    if (browserInstance) return browserInstance;
    const headless = app.settings.browserHeadless;
    const userDataDir = app.pathHelper.resolve(app.settings.browserUserDataDir);
    browserInstance = puppeteer.launch({headless, userDataDir});
    return browserInstance;
  },

  async pageAsync() {
    let page: puppeteer.Page | undefined;
    try {
      const browser = await browserHelper.browserAsync();
      const userAgent = await browser.userAgent();
      page = await browser.newPage();
      await page.setDefaultTimeout(app.settings.browserDefaultTimeout);
      await page.setUserAgent(userAgent.replace(/HeadlessChrome/g, 'Chrome'));
      await page.setViewport(app.settings.browserViewport);
      return page;
    } catch (error) {
      if (page) await page.close();
      throw error;
    }
  },

  async usingPageAsync<T>(handlerAsync: (page: puppeteer.Page) => Promise<T>) {
    const page = await browserHelper.pageAsync();
    try {
      return await handlerAsync(page);
    } finally {
      if (page) await page.close();
    }
  }
};
