import * as app from '..';

export class AdaptorCache implements app.IAdaptor {
  private readonly _adaptorId: string;
  private readonly _chapterId?: string;
  private readonly _seriesId?: string;
  
  constructor(seriesId?: string, chapterId?: string) {
    this._adaptorId = app.createUniqueId();
    this._chapterId = chapterId;
    this._seriesId = seriesId;
  }

  get detailLibrary() {
    if (!this._seriesId || !this._chapterId) return;
    const seriesId = this._seriesId;
    const chapterId = this._chapterId;
    const sync = false;
    return {seriesId, chapterId, sync};
  }

  endAsync(pageCount?: number) {
    if (!pageCount) return Promise.resolve();
    for (let i = 1; i <= pageCount; i++) app.core.cache.expire(`${this._adaptorId}/${i}`);
    return Promise.resolve();
  }

  async getAsync(pageNumber: number) {
    return await app.core.cache.getAsync<Buffer>(`${this._adaptorId}/${pageNumber}`, false);
  }

  async setAsync(pageNumber: number, image: Buffer) {
    await app.core.cache.setAsync(`${this._adaptorId}/${pageNumber}`, false, () => image);
  }
  
  successAsync() {
    return Promise.resolve();
  }
}
