import puppeteer from 'puppeteer';
import * as app from '../../..';
import * as chapter from '../evaluators/chapter';

// TODO: Clean me up.
export class BatotoRunnerComponent {
  private readonly _images: app.FutureMapComponent<string>;
  private readonly _session: app.FutureComponent<app.SessionComponent>;
  private readonly _url: string;
  private _hasSession: boolean;
  private _pageNumber: number;

  constructor(url: string) {
    this._hasSession = false;
    this._images = new app.FutureMapComponent<string>();
    this._pageNumber = 0;
    this._session = new app.FutureComponent<app.SessionComponent>();
    this._url = url;
  }
  
  run() {
    this._runAsync();
    return this._session;
  }

  private async _runAsync() {
    const page = await app.browserHelper.pageAsync();
    const watch = new app.WatchComponent(page);
    try {
      await page.goto(this._url);
      while (await this._stepAsync(page, watch));
    } catch (error) {
      this._images.reject(app.errorHelper.create(error));
      this._session.reject(app.errorHelper.create(error)); 
    } finally {
      await page.close();
    }
  }

  private async _stepAsync(page: puppeteer.Page, watch: app.WatchComponent) {
    const result = await page.evaluate(chapter.evaluator);

    // Initialize the session.
    if (!this._hasSession) {
      this._session.resolve(new app.SessionComponent(this._images, result.pageCount, this._url));
      this._hasSession = true;
    }
    
    // Initialize the images.
    for (const image of result.images) {
      this._pageNumber++;
      this._images.resolve(String(this._pageNumber), await watch.getAsync(image));
    }

    // Initialize the continuation.
    if (!result.shouldAwait) return result.shouldContinue;
    await new Promise((resolve) => setTimeout(resolve, app.settings.browserAwaitTimeout));
    return true;
  }
}
