import puppeteer from 'puppeteer-core';
import * as app from '..';

export class BrowserPage implements app.IBrowserManagerPage {
  private readonly _page: puppeteer.Page;

  constructor(page: puppeteer.Page) {
    this._page = page;
  }

  addEventListener(handler: (response: app.IBrowserManagerResponse) => void) {
    this._page.on('response', (response) => handler(new app.BrowserResponse(response)));
  }
  
  async evaluateAsync<T extends (...args: any[]) => any>(handler: T) {
    return await this._page.evaluate(handler);
  }

  async navigateAsync(url: string) {
    await this._page.goto(url, {waitUntil: 'domcontentloaded'});
  }

  async waitForNavigateAsync() {
    await this._page.waitForNavigation();
  }
}
