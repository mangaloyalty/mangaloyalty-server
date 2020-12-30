import * as app from '../..';
import * as browser from './evaluators/browser';
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
      const cache = new app.BrowserCache(page);
      await page.navigateAsync(`${baseUrl}/browse?langs=en${pageNumber && pageNumber > 1 ? `&page=${pageNumber}` : ''}`);
      await browserAsync(page);
      const results = await page.evaluateAsync(seriesList.evaluator);
      const items = await cache.batchAsync(results.items);
      return {hasMorePages: results.hasMorePages, items};
    });
  },

  async searchAsync(title: string, pageNumber?: number) {
    return await app.core.browser.pageAsync(async (page) => {
      const cache = new app.BrowserCache(page);
      await page.navigateAsync(`${baseUrl}/search?q=${encodeURIComponent(title)}${pageNumber && pageNumber > 1 ? `&a=&p=${pageNumber}` : ''}`);
      await browserAsync(page);
      const results = await page.evaluateAsync(seriesList.evaluator);
      const items = await cache.batchAsync(results.items);
      return {hasMorePages: results.hasMorePages, items};
    });
  },

  async seriesAsync(url: string) {
    return await app.core.browser.pageAsync(async (page) => {
      const cache = new app.BrowserCache(page);
      await page.navigateAsync(url);
      await browserAsync(page);
      const result = await page.evaluateAsync(seriesDetail.evaluator);
      return await cache.itemAsync(result);
    });
  },

  async startAsync(adaptor: app.IAdaptor, url: string) {
    const session = new app.SessionRunnable(adaptor, url);
    new Runner(session, url).runAsync();
    await session.waitPageCountAsync();
    return app.core.session.add(session);
  }
};

async function browserAsync(page: app.IBrowserPage) {
  const result = await page.evaluateAsync(browser.evaluator);
  if (!result.isVerification) return;
  await page.waitForNavigateAsync();
}
