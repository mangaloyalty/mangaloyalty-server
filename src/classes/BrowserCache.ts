import * as app from '..';

export class BrowserCache {
	private readonly _page: app.IBrowserPage;

  constructor(page: app.IBrowserPage) {
    this._page = page;
  }

  async batchAsync<T extends {image: string}>(items: T[]) {
    return await Promise.all(items.map(async (item) => {
      return await this.itemAsync(item);
    }));
  }
  
  async itemAsync<T extends {image: string}>(item: T) {
    const imageId = app.createUniqueId();
    await app.core.cache.setAsync(imageId, app.settings.cacheImageTimeout, () => this._page.responseAsync(item.image));
    return Object.assign({imageId}, item);
  }
}
