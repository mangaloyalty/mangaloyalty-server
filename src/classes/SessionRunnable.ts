import * as app from '..';

export class SessionRunnable implements app.ISession {
  private readonly _adaptor: app.IAdaptor;
  private readonly _hasStarted: app.Future<void>;
  private readonly _sessionId: string;
  private readonly _url: string;
  private _hasReject?: boolean;
  private _pageCount?: number;

  constructor(adaptor: app.IAdaptor, url: string) {
    this._adaptor = adaptor;
    this._hasStarted = new app.Future();
    this._sessionId = app.createUniqueId();
    this._url = url;
  }

  async expireAsync(error?: any) {
    if (this._hasReject) return;
    this._hasReject = true;
    this._hasStarted.reject(error);
    await this._adaptor.expireAsync(this._pageCount || 0);
  }

  getData() {
    const id = this._sessionId;
    const pageCount = this._pageCount || 0;
    const url = this._url;
    return {id, pageCount, url};
  }

  async getPageAsync(pageNumber: number) {
    if (pageNumber <= 0 || pageNumber > (this._pageCount || 0)) return;
    return await this._adaptor.getAsync(pageNumber);
  }

  get isActive() {
    return !this._hasReject;
  }
  
  async setImageAsync(pageNumber: number, image: string) {
    if (this._hasReject || pageNumber <= 0 || pageNumber > (this._pageCount || 0)) return;
    await this._adaptor.setAsync(pageNumber, {image});
  }

  setPageCount(pageCount: number) {
    if (this._hasReject) return;
    this._pageCount = this._pageCount || pageCount;
    this._hasStarted.resolve();
  }

  async successAsync() {
    if (this._hasReject) return;
    await this._adaptor.successAsync(this._pageCount || 0);
  }

  async waitAsync() {
    if (this._hasReject) return this.getData();
    await this._hasStarted.getAsync();
    return this.getData();
  }
}
