export interface IAdaptor {
  expire(pageNumber: number): void;
  getAsync(pageNumber: number): Promise<string>;
  setAsync(pageNumber: number, value: string): Promise<void>;
  successAsync(): Promise<void>;
}
