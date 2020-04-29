import * as app from '..';

export class Watch {
  private readonly _futureResponses: app.FutureMap<app.IBrowserManagerResponse | null>;
	private readonly _page: app.IBrowserManagerPage;

  constructor(page: app.IBrowserManagerPage) {
    this._futureResponses = new app.FutureMap(app.settings.chromeNavigationTimeout);
    this._page = page;
    this._page.addEventListener((response) => this._futureResponses.resolve(response.url, response));
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
    if (!response) throw new Error();
    return await response.bufferAsync();
  }
}
