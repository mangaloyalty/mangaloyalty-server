import * as app from '..';

export class BrowserCache {
	private readonly _page: app.IBrowserPage;

  constructor(page: app.IBrowserPage) {
    this._page = page;
  }

  async batchAsync<T>(items: (T & {image: string})[]) {
    return await Promise.all(items.map(async (item) => {
      return await this.itemAsync(item);
    }));
  }
  
  async itemAsync<T>(item: T & {image: string}): Promise<T & {imageId: string}> {
    const imageId = app.createUniqueId();
    await app.core.cache.setAsync(imageId, app.settings.cacheImageTimeout, () => this._page.responseAsync(item.image));
    delete item.image;
    return Object.assign({imageId}, item);
  }
}
