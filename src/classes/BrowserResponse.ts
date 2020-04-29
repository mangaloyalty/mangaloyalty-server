import puppeteer from 'puppeteer-core';
import * as app from '..';

export class BrowserResponse implements app.IBrowserManagerResponse {
  private readonly _response: puppeteer.Response;

  constructor(response: puppeteer.Response) {
    this._response = response;
  }

  async bufferAsync() {
    return await this._response.buffer();
  }

  get url() {
    return this._response.url();
  }
}
