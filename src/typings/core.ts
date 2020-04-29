import * as app from '..';

export interface IAutomateManager {
  run(): void;
}

export interface IBrowserManager {
  pageAsync<T>(handlerAsync: (page: IBrowserPage) => Promise<T> | T): Promise<T>;
  prepareAsync(): Promise<void>;
}

export interface IBrowserPage {
  addEventListener(handler: (response: app.IBrowserResponse) => void): void;
  evaluateAsync<T extends ((...args: any[]) => any)>(handler: T): Promise<ReturnType<T>>;
  navigateAsync(url: string): Promise<void>;
  waitForNavigateAsync(): Promise<void>;
}

export interface IBrowserResponse {
  bufferAsync(): Promise<Buffer>;
  readonly url: string;
}

export interface ICacheManager {
  expire(key: string): void;
  exists(key: string): boolean;
  getAsync<T>(key: string, timeout: false | number, valueFactory?: () => Promise<T> | T): Promise<T>;
  setAsync<T>(key: string, timeout: false | number, valueFactory: () => Promise<T> | T): Promise<void>;
}

export interface ILibraryManager {
  listReadAsync(readStatus: app.IEnumeratorReadStatus, seriesStatus: app.IEnumeratorSeriesStatus, sortKey: app.IEnumeratorSortKey, title?: string): Promise<app.ILibraryListReadResponse>;
  listPatchAsync(frequency: app.IEnumeratorFrequency, strategy: app.IEnumeratorStrategy): Promise<void>;
  seriesCheckedAsync(seriesId: string): Promise<boolean>;
  seriesCreateAsync(url: string): Promise<string>;
  seriesDeleteAsync(seriesId: string): Promise<boolean>;
  seriesDumpAsync(seriesId: string, writableStream: NodeJS.WritableStream): Promise<void>;
  seriesImageAsync(seriesId: string): Promise<Buffer | undefined>;
  seriesReadAsync(seriesId: string): Promise<app.ILibrarySeries | undefined>;
  seriesPatchAsync(seriesId: string, frequency: app.IEnumeratorFrequency, strategy: app.IEnumeratorStrategy): Promise<boolean>;
  seriesUpdateAsync(seriesId: string): Promise<boolean>;
  chapterDeleteAsync(seriesId: string, chapterId: string): Promise<boolean>;
  chapterReadAsync(seriesId: string, chapterId: string): Promise<app.ISession | undefined>;
  chapterPatchAsync(seriesId: string, chapterId: string, isReadCompleted?: boolean, pageReadNumber?: number): Promise<boolean>;
  chapterUpdateAsync(seriesId: string, chapterId: string): Promise<boolean>;
}

export interface IResourceManager {
  moveAsync(absoluteFromPath: string, absoluteToPath: string): Promise<void>;
  readdirAsync(absolutePath: string): Promise<string[]>;
  readFileAsync(absolutePath: string): Promise<Buffer>;
  readJsonAsync<T>(absolutePath: string): Promise<T>;
  removeAsync(absolutePath: string): Promise<void>;
  writeFileAsync<T>(absolutePath: string, value: T): Promise<void>;
}

export interface ISessionManager {
  add<T extends app.ISession>(session: T): T;
  get(id: string): app.ISession | undefined;
  getAll(seriesId?: string): app.ISessionList;
}

export interface ISocketManager {
  addEventListener(handler: (action: app.ISocketAction) => void): void;
  emit(action: app.ISocketAction): void;
}
