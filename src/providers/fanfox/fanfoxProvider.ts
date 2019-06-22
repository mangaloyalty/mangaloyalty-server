import puppeteer from 'puppeteer';
import * as app from '../..';
import * as search from './evaluators/search';
import * as series from './evaluators/series';
const baseUrl = 'https://fanfox.net';

export const fanfoxProvider = {
  isSupported(url: string) {
    return url.startsWith(baseUrl);
  },
  
  async searchAsync(title: string, pageNumber?: number) {
    return await app.browserHelper.usingPageAsync(async (page) => {
      const cache = new app.CacheComponent(page);
      await page.goto(`${baseUrl}/search?title=${encodeURIComponent(title)}${pageNumber && pageNumber > 1 ? `&page=${pageNumber}` : ''}`);
      const results = await page.evaluate(search.evaluator);
      await cache.resolveOrDeleteAsync('image', ...results);
      return results;
    });
  },

  async seriesAsync(url: string) {
    return await app.browserHelper.usingPageAsync(async (page) => {
      const cache = new app.CacheComponent(page);
      await page.goto(url);
      await ensureAdultAsync(page);
      const result = await page.evaluate(series.evaluator);
      await cache.resolveOrDeleteAsync('image', result);
      return result;
    });
  },

  async chapterAsync(url: string) {
    const runner = new app.FanfoxRunnerComponent(url).run();
    const session = await runner.getAsync();
    app.sessionManager.add(session);
    return session;
  }
};

async function ensureAdultAsync(page: puppeteer.Page) {
  const waitPromise = page.waitForNavigation();
  if (await page.evaluate(series.shouldWaitAdultEvaluator)) await waitPromise;
  else waitPromise.catch(() => undefined);
}
