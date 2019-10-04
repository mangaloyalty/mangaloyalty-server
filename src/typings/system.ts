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

export type ISocketAction = 
  {type: 'SeriesCreate' , seriesId: string} |
  {type: 'SeriesDelete' , seriesId: string} |
  {type: 'SeriesPatch'  , seriesId: string} |
  {type: 'SeriesUpdate' , seriesId: string} |
  {type: 'ChapterDelete', seriesId: string, chapterId: string} |
  {type: 'ChapterPatch' , seriesId: string, chapterId: string} |
  {type: 'ChapterUpdate', seriesId: string, chapterId: string} |
  {type: 'SessionCreate', session: app.ISessionListItem} |
  {type: 'SessionDelete', session: app.ISessionListItem} |
  {type: 'SessionUpdate', session: app.ISessionListItem};
