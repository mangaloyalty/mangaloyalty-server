import * as app from '..';

export class SessionRunnable implements app.ISession {
  private readonly _adaptor: app.IAdaptor;
  private readonly _hasFinished: app.Future<boolean>;
  private readonly _hasProgress: app.Future<void>;
  private readonly _sessionId: string;
  private readonly _url: string;
  private _error?: any;
  private _hasEnded?: boolean;
  private _pageCount?: number;

  constructor(adaptor: app.IAdaptor, url: string) {
    this._adaptor = adaptor;
    this._hasFinished = new app.Future();
    this._hasProgress = new app.Future();
    this._sessionId = app.createUniqueId();
    this._url = url;
  }

  async endAsync(error?: any) {
    if (this._hasEnded) return;
    this._error = error;
    this._hasEnded = true;
    this._hasFinished.resolve(false);
    this._hasProgress.reject();
    await this._adaptor.expireAsync(this._pageCount || 0);
  }
    
  getData() {
    const id = this._sessionId;
    const pageCount = this._pageCount || 0;
    const url = this._url;
    return {id, pageCount, url};
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
    this._hasProgress.resolve();
  }

  async successAsync() {
    if (this._hasEnded) throw this._error;
    await this._adaptor.successAsync(this._pageCount || 0);
    this._hasFinished.resolve(true);
  }

  async waitFinishedAsync() {
    if (this._hasEnded) throw this._error;
    return await this._hasFinished.getAsync();
  }

  async waitProgressAsync() {
    if (this._hasEnded) throw this._error;
    return await this._hasProgress.getAsync();
  }
}
