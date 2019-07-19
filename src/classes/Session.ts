import * as app from '..';

export class Session implements app.ISessionListItem {
  private readonly _images: app.FutureMap<string>;

  constructor(images: app.FutureMap<string>, pageCount: number, url: string) {
    Object.defineProperty(this, '_images', {enumerable: false, writable: true});
    this._images = images;
    this.id = app.createUniqueId();
    this.pageCount = pageCount;
    this.url = url;
  }

  async getImageAsync(pageNumber: number) {
    if (pageNumber < 0 || pageNumber > this.pageCount) return;
    return await this._images.getAsync(String(pageNumber));
  }

  readonly id: string;
  readonly pageCount: number;
  readonly url: string;
}
