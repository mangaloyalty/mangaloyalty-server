import * as app from '../..';
import * as seriesDetail from './evaluators/seriesDetail';
import * as seriesList from './evaluators/seriesList';
import {Runner} from './classes/Runner';
const baseUrl = 'https://bato.to';

export const batotoProvider = {
  isSupported(url: string) {
    return url.startsWith(baseUrl);
  },

  async popularAsync(pageNumber?: number) {
    return await app.core.browser.pageAsync(async (page) => {
      const watch = new app.Watch(page);
      await page.goto(`${baseUrl}/browse?langs=english${pageNumber && pageNumber > 1 ? `&page=${pageNumber}` : ''}`, {waitUntil: 'domcontentloaded'});
      const results = await page.evaluate(seriesList.evaluator);
      const items = await watch.cacheItemsAsync(results.items);
      return {hasMorePages: results.hasMorePages, items};
    });
  },

  async searchAsync(title: string, pageNumber?: number) {
    return await app.core.browser.pageAsync(async (page) => {
      const watch = new app.Watch(page);
      await page.goto(`${baseUrl}/search?q=${encodeURIComponent(title)}${pageNumber && pageNumber > 1 ? `&a=&p=${pageNumber}` : ''}`, {waitUntil: 'domcontentloaded'});
      const results = await page.evaluate(seriesList.evaluator);
      const items = await watch.cacheItemsAsync(results.items);
      return {hasMorePages: results.hasMorePages, items};
    });
  },

  async seriesAsync(url: string) {
    return await app.core.browser.pageAsync(async (page) => {
      const watch = new app.Watch(page);
      await page.goto(url, {waitUntil: 'domcontentloaded'});
      const result = await page.evaluate(seriesDetail.evaluator);
      return await watch.cacheAsync(result);
    });
  },

  async startAsync(adaptor: app.IAdaptor, url: string) {
    const session = new app.SessionRunnable(adaptor, url);
    new Runner(session, url).runAsync();
    await session.waitPageCountAsync();
    return app.core.session.add(session);
  }
};
