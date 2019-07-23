import * as app from '..';

export interface IAdaptor {
  expireAsync(pageCount: number): Promise<void>;
  getAsync(pageNumber: number): Promise<app.ISessionPage>;
  setAsync(pageNumber: number, page: app.ISessionPage): Promise<void>;
  successAsync(pageCount: number): Promise<void>;
}
