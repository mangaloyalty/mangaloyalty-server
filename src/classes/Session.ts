import * as app from '..';

export class Session {
  private readonly _adaptor: app.IAdaptor;
  private readonly _id: string;
  private readonly _isActive: app.Future<void>;
  private readonly _url: string;
  private _hasReject?: boolean;
  private _pageCount?: number;

  constructor(adaptor: app.IAdaptor, url: string) {
    this._adaptor = adaptor;
    this._id = app.createUniqueId();
    this._isActive = new app.Future();
    this._url = url;
  }

  async expireAsync(error?: Error) {
    if (this._hasReject) return;
    this._hasReject = true;
    this._isActive.reject(error);
    await this._adaptor.expireAsync(this._pageCount || 0);
  }

  getData() {
    const id = this._id;
    const pageCount = this._pageCount || 0;
    const url = this._url;
    return {id, pageCount, url};
  }

  async getPageAsync(pageNumber: number) {
    if (pageNumber <= 0 || pageNumber > (this._pageCount || 0)) return;
    return await this._adaptor.getAsync(pageNumber);
  }

  async setImageAsync(pageNumber: number, image: string) {
    if (this._hasReject || pageNumber <= 0 || pageNumber > (this._pageCount || 0)) return;
    await this._adaptor.setAsync(pageNumber, {image});
  }

  setPageCount(pageCount: number) {
    if (this._hasReject) return;
    this._pageCount = this._pageCount || pageCount;
    this._isActive.resolve();
  }

  async successAsync() {
    if (this._hasReject) return;
    await this._adaptor.successAsync(this._pageCount || 0);
  }

  async waitAsync() {
    await this._isActive.getAsync();
    return this.getData();
  }
}
