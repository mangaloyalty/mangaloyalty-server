import puppeteer from 'puppeteer';
import * as app from '../../..';
import * as chapter from '../evaluators/chapter';

export class Runner {
  private readonly _session: app.Session;
  private readonly _url: string;
  private _pageNumber: number;

  constructor(session: app.Session, url: string) {
    this._pageNumber = 0;
    this._session = session;
    this._url = url;
  }
  
  async runAsync() {
    try {
      await app.core.browser.pageAsync(async (page) => {
        const watch = new app.Watch(page);
        await page.goto(this._url, {waitUntil: 'domcontentloaded'});
        while (await this._stepAsync(page, watch));
        await this._session.successAsync();
      });
    } catch (error) {
      await this._session.expireAsync(app.core.error.create(error));
    }
  }

  private async _stepAsync(page: puppeteer.Page, watch: app.Watch) {
    const result = await page.evaluate(chapter.evaluator);
    this._session.setPageCount(result.pageCount);
    for (const image of result.images) await this._session.setImageAsync(++this._pageNumber, await watch.getAsync(image));
    return result.shouldContinue;
  }
}
