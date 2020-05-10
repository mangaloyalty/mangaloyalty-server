import * as app from '../../..';
import * as browser from '../evaluators/browser';
import * as chapter from '../evaluators/chapter';

export class Runner {
  private readonly _session: app.SessionRunnable;
  private readonly _url: string;
  private _pageNumber: number;

  constructor(session: app.SessionRunnable, url: string) {
    this._pageNumber = 0;
    this._session = session;
    this._url = url;
  }
  
  async runAsync() {
    try {
      await app.core.browser.pageAsync(async (page) => {
        await page.navigateAsync(this._url);
        await browserAsync(page);
        while (await this._stepAsync(page));
        await this._session.successAsync();
      });
    } catch (error) {
      await this._session.errorAsync(error);
    }
  }

  private async _stepAsync(page: app.IBrowserPage) {
    const result = await page.evaluateAsync(chapter.evaluator);
    this._session.setPageCount(result.pageCount);
    for (const image of result.images) await this._session.setImageAsync(++this._pageNumber, await page.responseAsync(image));
    return this._session.isActive && result.shouldContinue;
  }
}

async function browserAsync(page: app.IBrowserPage) {
  const result = await page.evaluateAsync(browser.evaluator);
  if (!result.isVerification) return;
  await page.waitForNavigateAsync();
}
