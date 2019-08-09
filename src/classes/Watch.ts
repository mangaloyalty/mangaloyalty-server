import * as app from '..';
import * as puppeteer from 'puppeteer';

export class Watch {
  private readonly _futureResponses: app.FutureMap<puppeteer.Response | null>;
	private readonly _page: puppeteer.Page;

  constructor(page: puppeteer.Page) {
    this._futureResponses = new app.FutureMap(app.settings.browserNavigationTimeout);
    this._page = page;
    this._page.on('response', (response) => this._futureResponses.resolve(response.url(), response));
  }

  async getAsync(url: string) {
    const response = await this._futureResponses.getAsync(url);
    const responseBuffer = response && await response.buffer();
    if (!responseBuffer) throw new Error();
    return responseBuffer;
  }

  // TECH: Constraints for value[key] is string|undefined
  // https://stackoverflow.com/questions/49752151/typescript-keyof-returning-specific-type/49752227#49752227
  async resolveOrDeleteAsync(key: string, ...values: any[]) {
    for (const value of values) {
      const property = value[key];
      const image = typeof property === 'string' && await this.getAsync(property);
      value[key] = (image && image.toString('base64')) || value[key];
    }
  }
}
