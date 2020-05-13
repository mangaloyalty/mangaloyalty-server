import * as app from '../../..';
import * as browser from '../evaluators/browser';
import * as chapter from '../evaluators/chapter';

export class Runner {
  private readonly _session: app.SessionRunnable;
  private readonly _url: string;
  private _pageNumber: number;

  constructor(session: app.SessionRunnable, url: string) {
    this._pageNumber = 1;
    this._session = session;
    this._url = url;
  }
  
  async runAsync() {
    try {
      await app.core.browser.pageAsync(async (page) => {
        await page.navigateAsync(`${this._url}/1`);
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
    await this._session.setImageAsync(this._pageNumber++, await page.responseAsync(result.image));
    if (!this._session.isActive || !result.shouldContinue) return false;
    await page.navigateAsync(`${this._url}/${this._pageNumber}`);
    return true;
  }
}

async function browserAsync(page: app.IBrowserPage) {
  const result = await page.evaluateAsync(browser.evaluator);
  if (!result.isVerification) return;
  await page.waitForNavigateAsync();
}
