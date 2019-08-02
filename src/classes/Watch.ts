import * as app from '..';
import * as puppeteer from 'puppeteer';

export class Watch {
	private readonly _page: puppeteer.Page;
  private readonly _responses: app.FutureMap<puppeteer.Response | null>;

  constructor(page: puppeteer.Page) {
    this._page = page;
    this._page.on('response', (response) => this._responses.resolve(response.url(), response));
    this._responses = new app.FutureMap(app.settings.browserNavigationTimeout);
  }

  async getAsync(url: string) {
    const response = await this._responses.getAsync(url);
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
