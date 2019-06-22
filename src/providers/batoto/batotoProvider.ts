import * as app from '../..';
import * as search from './evaluators/search';
import * as series from './evaluators/series';
const baseUrl = 'https://bato.to';

export const batotoProvider = {
  isSupported(url: string) {
    return url.startsWith(baseUrl);
  },

  async searchAsync(title: string, pageNumber?: number) {
    return await app.browserHelper.usingPageAsync(async (page) => {
      const cache = new app.CacheComponent(page);
      await page.goto(`${baseUrl}/search?q=${encodeURIComponent(title)}${pageNumber && pageNumber > 1 ? `&p=${pageNumber}` : ''}`);
      const results = await page.evaluate(search.evaluator);
      await cache.resolveOrDeleteAsync('image', ...results);
      return results;
    });
  },

  async seriesAsync(url: string) {
    return await app.browserHelper.usingPageAsync(async (page) => {
      const cache = new app.CacheComponent(page);
      await page.goto(url);
      const result = await page.evaluate(series.evaluator);
      await cache.resolveOrDeleteAsync('image', result);
      return result;
    });
  },

  async chapterAsync(url: string) {
    const runner = new app.BatotoRunnerComponent(url).run();
    const session = await runner.getAsync();
    app.sessionManager.add(session);
    return session;
  }
};
