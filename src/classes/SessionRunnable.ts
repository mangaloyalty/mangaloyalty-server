import * as app from '..';

export class SessionRunnable implements app.ISession {
  private readonly _adaptor: app.IAdaptor;
  private readonly _futureFinished: app.Future<void>;
  private readonly _futurePageCount: app.Future<void>;
  private readonly _sessionId: string;
  private readonly _url: string;
  private _error?: any;
  private _finishedAt?: number;
  private _hasEnded?: boolean;
  private _hasSuccess?: boolean;
  private _pageCount?: number;

  constructor(adaptor: app.IAdaptor, url: string) {
    this._adaptor = adaptor;
    this._futureFinished = new app.Future();
    this._futurePageCount = new app.Future();
    this._sessionId = app.createUniqueId();
    this._url = url;
  }

  async endAsync(error?: any) {
    if (this._hasEnded) return;
    this._error = error;
    this._finishedAt = this._finishedAt || Date.now();
    this._hasEnded = true;
    this._hasSuccess = this._hasSuccess || false;
    this._futureFinished.reject(error);
    this._futurePageCount.reject(error);
    await this._adaptor.endAsync(this._pageCount || 0);
  }

  getData() {
    const id = this._sessionId;
    const finishedAt = this._finishedAt;
    const library = this._adaptor.detailLibrary;
    const pageCount = this._pageCount || 0;
    const url = this._url;
    return {id, finishedAt, pageCount, url, library};
  }

  async getPageAsync(pageNumber: number) {
    if (this._hasEnded) throw this._error;
    if (pageNumber <= 0 || pageNumber > (this._pageCount || 0)) return;
    return await this._adaptor.getAsync(pageNumber);
  }

  get isActive() {
    return !this._hasEnded;
  }
  
  async setImageAsync(pageNumber: number, image: Buffer) {
    if (this._hasEnded) throw this._error;
    if (pageNumber <= 0 || pageNumber > (this._pageCount || 0)) return;
    await this._adaptor.setAsync(pageNumber, image);
  }

  setPageCount(pageCount: number) {
    if (this._hasEnded) throw this._error;
    this._pageCount = this._pageCount || pageCount;
    this._futurePageCount.resolve();
  }

  async successAsync() {
    if (this._hasEnded) throw this._error;
    await this._adaptor.successAsync(this._pageCount || 0);
    this._finishedAt = Date.now();
    this._hasSuccess = true;
    this._futureFinished.resolve();
    await app.core.socket.queueAsync({type: 'SessionUpdate', session: this.getData()});
  }

  async waitFinishedAsync() {
    if (this._hasEnded) throw this._error;
    await this._futureFinished.getAsync();
    return this._hasSuccess;
  }

  async waitPageCountAsync() {
    if (this._hasEnded) throw this._error;
    await this._futurePageCount.getAsync();
  }
}
