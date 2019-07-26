import * as app from '..';
import {batotoProvider} from './batoto/batotoProvider';
import {fanfoxProvider} from './fanfox/fanfoxProvider';

export const provider = {
  async popularAsync(providerName: app.IEnumeratorProvider, pageNumber?: number) {
    switch (providerName) {
      case 'batoto':
        return await batotoProvider.popularAsync(pageNumber);
      case 'fanfox':
        return await fanfoxProvider.popularAsync(pageNumber);
      default:
        throw new Error();
    }
  },

  async searchAsync(providerName: app.IEnumeratorProvider, title: string, pageNumber?: number) {
    switch (providerName) {
      case 'batoto':
        return await batotoProvider.searchAsync(title, pageNumber);
      case 'fanfox':
        return await fanfoxProvider.searchAsync(title, pageNumber);
      default:
        throw new Error();
    }
  },

  async seriesAsync(url: string) {
    if (batotoProvider.isSupported(url)) {
      return await batotoProvider.seriesAsync(url);
    } else if (fanfoxProvider.isSupported(url)) {
      return await fanfoxProvider.seriesAsync(url);
    } else {
      throw new Error();
    }
  },
  
  async startAsync(adaptor: app.IAdaptor, url: string) {
    if (batotoProvider.isSupported(url)) {
      return await batotoProvider.startAsync(adaptor, url);
    } else if (fanfoxProvider.isSupported(url)) {
      return await fanfoxProvider.startAsync(adaptor, url);
    } else {
      throw new Error();
    }
  }  
};
