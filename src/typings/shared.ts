import * as app from '..';
export type IFileSeries = app.ILibrarySeries & {source: IFileSeriesSource};
export type IFileSeriesSource = app.ILibrarySeriesSource & {image?: string};

export interface IAdaptor {
  detailLibrary?: {seriesId: string, chapterId: string, sync: boolean};
  endAsync(pageCount?: number): Promise<void>;
  getAsync(pageNumber: number): Promise<Buffer>;
  setAsync(pageNumber: number, image: Buffer): Promise<void>;
  successAsync(pageCount?: number): Promise<void>;
}

export interface ISession {
  endAsync(): Promise<void>;
  getData(): app.ISessionListItem;
  getPageAsync(pageNumber: number): Promise<Buffer | undefined>;
}
