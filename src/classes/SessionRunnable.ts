import * as app from '..';

export class SessionRunnable implements app.ISession {
  private readonly _adaptor: app.IAdaptor;
  private readonly _futureFinished: app.Future<void>;
  private readonly _futurePageCount: app.Future<void>;
  private readonly _sessionId: string;
  private readonly _url: string;
  private _error?: any;
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
    this._hasEnded = true;
    this._hasSuccess = this._hasSuccess || false;
    this._futureFinished.reject(error);
    this._futurePageCount.reject(error);
    await this._adaptor.endAsync(this._pageCount || 0);
  }

  getData() {
    const id = this._sessionId;
    const isLocal = false;
    const isSuccessful = this._hasSuccess;
    const library = this._adaptor.detailLibrary;
    const pageCount = this._pageCount || 0;
    const url = this._url;
    return {id, isLocal, isSuccessful, pageCount, url, library};
  }

  async getPageAsync(pageNumber: number) {
    if (this._hasEnded) throw this._error;
    if (pageNumber <= 0 || pageNumber > (this._pageCount || 0)) return;
    return await this._adaptor.getAsync(pageNumber);
  }

  get isActive() {
    return !this._hasEnded;
  }
  
  async setImageAsync(pageNumber: number, buffer: Buffer) {
    if (this._hasEnded) throw this._error;
    if (pageNumber <= 0 || pageNumber > (this._pageCount || 0)) return;
    await this._adaptor.setAsync(pageNumber, buffer);
  }

  setPageCount(pageCount: number) {
    if (this._hasEnded) throw this._error;
    this._pageCount = this._pageCount || pageCount;
    this._futurePageCount.resolve();
  }

  async successAsync() {
    if (this._hasEnded) throw this._error;
    await this._adaptor.successAsync(this._pageCount || 0);
    this._hasSuccess = true;
    this._futureFinished.resolve();
  }

  async waitFinishedAsync() {
    if (this._hasEnded) throw this._error;
    await this._futureFinished.getAsync();
  }

  async waitPageCountAsync() {
    if (this._hasEnded) throw this._error;
    await this._futurePageCount.getAsync();
  }
}
