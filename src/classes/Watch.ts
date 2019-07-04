import * as app from '..';
import * as puppeteer from 'puppeteer';

// TODO: Add support for broken images (http://fanfox.net/manga/star_martial_god_technique/c001/1.html, page 1).
export class Watch {
	private readonly _page: puppeteer.Page;
  private readonly _responses: app.FutureMap<puppeteer.Response | null>;

  constructor(page: puppeteer.Page) {
    this._page = page;
    this._page.on('requestfinished', (request) => this._responses.resolve(request.url(), request.response()));
    this._responses = new app.FutureMap(app.settings.browserDefaultTimeout);
  }

  async getAsync(url: string) {
    const response = await this._responses.getAsync(url);
    const responseBuffer = response && await response.buffer();
    const image = responseBuffer && responseBuffer.toString('base64');
    if (!image) throw new Error();
    return image;
  }

  // TECH: Constraints for value[key] is string|undefined
  // https://stackoverflow.com/questions/49752151/typescript-keyof-returning-specific-type/49752227#49752227
  async resolveOrDeleteAsync(key: string, ...values: any[]) {
    for (const value of values) {
      const property = value[key];
      const image = typeof property === 'string' && await this.getAsync(property);
      value[key] = image || value[key];
    }
  }
}
