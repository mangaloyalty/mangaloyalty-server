import * as app from '..';
let previousId = 0;

@app.serializableDecorator
export class SessionComponent implements app.ISession {
  private readonly _images: app.FutureMapComponent<string>;

  constructor(images: app.FutureMapComponent<string>, pageCount: number, url: string) {
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
