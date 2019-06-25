import * as app from '..';
let previousId = 0;

export class Session implements app.ISessionListItem {
  private readonly _images: app.FutureMap<string>;

  constructor(images: app.FutureMap<string>, pageCount: number, url: string) {
    Object.defineProperty(this, '_images', {enumerable: false, writable: true});
    this._images = images;
    this.id = ++previousId;
    this.pageCount = pageCount;
    this.url = url;
  }

  async getImageAsync(pageNumber: number) {
    if (pageNumber < 0 || pageNumber > this.pageCount) return;
    return await this._images.getAsync(String(pageNumber));
  }

  readonly id: number;
  readonly pageCount: number;
  readonly url: string;
}
