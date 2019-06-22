import * as api from 'express-openapi-json';
import * as app from '..';

// TODO: Add pagination indicators (hasMorePages?).
export class RemoteController {
  @api.createOperation('RemoteSearch')
  async searchAsync(model: app.IRemoteSearchContext): Promise<api.Result<app.IRemoteSearch>> {
    const title = model.query.title;
    const pageNumber = model.query.pageNumber;
    switch (model.query.providerName) {
      case 'batoto':
        return api.json(await app.batotoProvider.searchAsync(title, pageNumber));
      case 'fanfox':
        return api.json(await app.fanfoxProvider.searchAsync(title, pageNumber));
      default:
        throw new Error();
    }
  }

  // TODO: Add resolved url. Because provider can do redirections, and the library needs to understand that later!
  @api.createOperation('RemoteSeries')
  async seriesAsync(model: app.IRemoteSeriesContext): Promise<api.Result<app.IRemoteSeries>> {
    if (app.batotoProvider.isSupported(model.query.url)) {
      return api.json(await app.batotoProvider.seriesAsync(model.query.url));
    } else if (app.fanfoxProvider.isSupported(model.query.url)) {
      return api.json(await app.fanfoxProvider.seriesAsync(model.query.url));
    } else {
      throw new Error();
    }
  }

  @api.createOperation('RemoteStart')
  async chapterAsync(model: app.IRemoteStartContext): Promise<api.Result<app.IRemoteStart>> {
    if (app.batotoProvider.isSupported(model.query.url)) {
      return api.json(await app.batotoProvider.chapterAsync(model.query.url));
    } else if (app.fanfoxProvider.isSupported(model.query.url)) {
      return api.json(await app.fanfoxProvider.chapterAsync(model.query.url));
    } else {
      throw new Error();
    }
  }
}
