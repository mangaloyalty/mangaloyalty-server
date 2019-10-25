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

  async cacheAsync<T extends {image: string}>(item: T) {
    const imageId = app.createUniqueId();
    await app.core.cache.setAsync(imageId, app.settings.cacheImageTimeout, () => this.getAsync(item.image));
    return Object.assign({imageId}, item);
  }

  async cacheItemsAsync<T extends {image: string}>(items: T[]) {
    return await Promise.all(items.map(async (item) => {
      return await this.cacheAsync(item);
    }));
  }
  
  async getAsync(url: string) {
    const response = await this._futureResponses.getAsync(url);
    const responseBuffer = response && await response.buffer();
    if (!responseBuffer) throw new Error();
    return responseBuffer;
  }
}
