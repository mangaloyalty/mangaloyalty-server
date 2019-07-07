import puppeteer from 'puppeteer';
import * as app from '../../..';
import * as chapter from '../evaluators/chapter';

// TECH: Clean me up.
export class Runner {
  private readonly _images: app.FutureMap<string>;
  private readonly _session: app.Future<app.Session>;
  private readonly _url: string;
  private _hasSession: boolean;
  private _pageNumber: number;

  constructor(url: string) {
    this._hasSession = false;
    this._images = new app.FutureMap<string>();
    this._pageNumber = 0;
    this._session = new app.Future<app.Session>();
    this._url = url;
  }
  
  run() {
    this._runAsync();
    return this._session;
  }

  private async _runAsync() {
    try {
      await app.browserManager.pageAsync(async (page) => {
        const watch = new app.Watch(page);
        await page.goto(this._url, {waitUntil: 'domcontentloaded'});
        while (await this._stepAsync(page, watch));
      });
    } catch (error) {
      this._images.reject(app.errorManager.create(error));
      this._session.reject(app.errorManager.create(error)); 
    }
  }

  private async _stepAsync(page: puppeteer.Page, watch: app.Watch) {
    const result = await page.evaluate(chapter.evaluator);

    // Initialize the session.
    if (!this._hasSession) {
      this._session.resolve(new app.Session(this._images, result.pageCount, this._url));
      this._hasSession = true;
    }
    
    // Initialize the images.
    for (const image of result.images) {
      this._pageNumber++;
      this._images.resolve(String(this._pageNumber), await watch.getAsync(image));
    }

    // Initialize the continuation.
    return result.shouldContinue;
  }
}