import * as app from '..';

export interface IAdaptor {
  detailLibrary?: {seriesId: string, chapterId: string, sync: boolean};
  endAsync(pageCount: number): Promise<void>;
  getAsync(pageNumber: number): Promise<app.ISessionPage>;
  setAsync(pageNumber: number, buffer: Buffer): Promise<void>;
  successAsync(pageCount: number): Promise<void>;
}

export interface ISession {
  endAsync(error?: any): Promise<void>;
  getData(): app.ISessionListItem;
  getPageAsync(pageNumber: number): Promise<app.ISessionPage | undefined>;
}
