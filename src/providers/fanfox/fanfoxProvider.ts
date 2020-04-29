import * as app from '../..';
import * as seriesDetail from './evaluators/seriesDetail';
import * as seriesList from './evaluators/seriesList';
import {Runner} from './classes/Runner';
const baseUrl = 'https://fanfox.net';

export const fanfoxProvider = {
  isSupported(url: string) {
    return url.startsWith(baseUrl);
  },

  async popularAsync(pageNumber?: number) {
    return await app.core.browser.pageAsync(async (page) => {
      const watch = new app.Watch(page);
      await page.navigateAsync(`${baseUrl}/directory/${pageNumber && pageNumber > 1 ? `${pageNumber}.html` : ''}`);
      const results = await page.evaluateAsync(seriesList.evaluator);
      const items = await watch.cacheItemsAsync(results.items);
      return {hasMorePages: results.hasMorePages, items};
    });
  },

  async searchAsync(title: string, pageNumber?: number) {
    return await app.core.browser.pageAsync(async (page) => {
      const watch = new app.Watch(page);
      await page.navigateAsync(`${baseUrl}/search?title=${encodeURIComponent(title)}${pageNumber && pageNumber > 1 ? `&page=${pageNumber}` : ''}`);
      const results = await page.evaluateAsync(seriesList.evaluator);
      const items = await watch.cacheItemsAsync(results.items);
      return {hasMorePages: results.hasMorePages, items};
    });
  },

  async seriesAsync(url: string) {
    return await app.core.browser.pageAsync(async (page) => {
      const watch = new app.Watch(page);
      await page.navigateAsync(url);
      await ensureAdultAsync(page);
      const result = await page.evaluateAsync(seriesDetail.evaluator);
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

async function ensureAdultAsync(page: app.IBrowserManagerPage) {
  const waitPromise = page.waitForNavigateAsync();
  if (await page.evaluateAsync(seriesDetail.shouldWaitAdultEvaluator)) await waitPromise;
  else waitPromise.catch(() => undefined);
}
