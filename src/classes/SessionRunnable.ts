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
  private _hasError?: boolean;
  private _pageCount?: number;

  constructor(adaptor: app.IAdaptor, url: string) {
    this._adaptor = adaptor;
    this._futureFinished = new app.Future();
    this._futurePageCount = new app.Future();
    this._sessionId = app.createUniqueId();
    this._url = url;
  }

  async endAsync() {
    if (this._hasEnded) return;
    this._hasEnded = true;
    this._futureFinished.reject(new Error());
    this._futurePageCount.reject(new Error());
    await this._adaptor.endAsync(this._pageCount);
  }

  async errorAsync(error: any) {
    if (this._hasEnded || this._hasError) return;
    this._error = error;
    this._hasError = true;
    this._finishedAt = Date.now();
    this._futureFinished.reject(error);
    this._futurePageCount.reject(error);
    app.core.socket.emit({type: 'SessionUpdate', session: this.getData()});
    app.writeError(error);
  }

  getData() {
    if (!this._pageCount) throw new Error();
    const id = this._sessionId;
    const finishedAt = this._finishedAt;
    const library = this._adaptor.detailLibrary;
    const pageCount = this._pageCount;
    const url = this._url;
    return {id, finishedAt, pageCount, url, library};
  }

  async getPageAsync(pageNumber: number) {
    if (this._hasEnded || this._hasError || !this._pageCount) throw this._error || new Error();
    if (pageNumber < 1 || pageNumber > this._pageCount) return;
    return await this._adaptor.getAsync(pageNumber);
  }

  get isActive() {
    return !this._hasEnded;
  }
  
  async setImageAsync(pageNumber: number, image: Buffer) {
    if (this._hasEnded || this._hasError || !this._pageCount) throw this._error || new Error();
    if (pageNumber < 1 || pageNumber > this._pageCount) return;
    if (!app.imageContentType(image)) throw new Error(image.slice(0, 6).toString('hex'));
    await this._adaptor.setAsync(pageNumber, image);
  }

  setPageCount(pageCount: number) {
    if (this._hasEnded || this._hasError) throw this._error || new Error();
    this._pageCount = this._pageCount || pageCount;
    this._futurePageCount.resolve();
  }

  async successAsync() {
    if (this._hasEnded || this._hasError) throw this._error || new Error();
    await this._adaptor.successAsync(this._pageCount);
    this._finishedAt = Date.now();
    this._futureFinished.resolve();
    app.core.socket.emit({type: 'SessionUpdate', session: this.getData()});
  }

  async waitFinishedAsync() {
    if (this._hasEnded || this._hasError) throw this._error || new Error();
    await this._futureFinished.getAsync();
  }

  async waitPageCountAsync() {
    if (this._hasEnded || this._hasError) throw this._error || new Error();
    await this._futurePageCount.getAsync();
  }
}
