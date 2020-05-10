import puppeteer from 'puppeteer-core';
import * as app from '..';

export class BrowserPage implements app.IBrowserPage {
  private readonly _futureResponses: app.FutureMap<puppeteer.Response>;
	private readonly _page: puppeteer.Page;

  constructor(page: puppeteer.Page) {
    this._futureResponses = new app.FutureMap(app.settings.chromeNavigationTimeout);
    this._page = page;
    this._page.on('response', (response) => this._futureResponses.resolve(response.url(), response));
  }

  async evaluateAsync<T extends (...args: any[]) => any>(handler: T) {
    const resultPromise = this._page.evaluate(handler);
    await Promise.race([resultPromise, this._page.waitFor(30000)]);
    return await resultPromise;
  }

  async navigateAsync(url: string) {
    await this._page.goto(url, {waitUntil: 'domcontentloaded'});
  }

  async responseAsync(url: string) {
    const response = await this._futureResponses.getAsync(url);
    if (!response) throw new Error();
    return await response.buffer();
  }
  
  async waitForNavigateAsync() {
    await this._page.waitForNavigation();
  }
}
