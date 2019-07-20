import * as app from '..';

export interface ISession {
  expire(): void;
  getData(): app.ISessionListItem;
  getImageAsync(pageNumber: number): Promise<string | undefined>;
  readonly id: string;
  readonly isValid: boolean;
}
