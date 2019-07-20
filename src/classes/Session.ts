import * as app from '..';

export class Session {
  private readonly _adaptor: app.IAdaptor;
  private readonly _id: string;
  private readonly _isActive: app.Future<void>;
  private readonly _url: string;
  private _hasReject?: boolean;
  private _pageCount?: number;

  constructor(adaptor: app.IAdaptor, id: string, url: string) {
    this._adaptor = adaptor;
    this._id = id;
    this._isActive = new app.Future();
    this._url = url;
  }

  expire(error?: Error) {
    if (this._hasReject) return;
    this._hasReject = true;
    this._isActive.reject(error);
    for (let i = 1; i <= (this._pageCount || 0); i++) this._adaptor.expire(i);
  }

  getData() {
    const id = this._id;
    const pageCount = this._pageCount || 0;
    const url = this._url;
    return {id, pageCount, url};
  }

  async getImageAsync(pageNumber: number) {
    if (this._hasReject || pageNumber <= 0 || pageNumber > (this._pageCount || 0)) return;
    return await this._adaptor.getAsync(pageNumber);
  }

  get id() {
    return this._id;
  }

  get isValid() {
    return Boolean(!this._hasReject && this._pageCount);
  }

  async setImageAsync(pageNumber: number, image: string) {
    if (this._hasReject || pageNumber <= 0 || pageNumber > (this._pageCount || 0)) return;
    await this._adaptor.setAsync(pageNumber, image);
  }

  setPageCount(pageCount: number) {
    if (this._hasReject) return;
    this._pageCount = this._pageCount || pageCount;
    this._isActive.resolve();
  }

  async successAsync() {
    if (this._hasReject) return;
    await this._adaptor.successAsync();
  }

  async waitAsync() {
    await this._isActive.getAsync();
    return this.getData();
  }
}
