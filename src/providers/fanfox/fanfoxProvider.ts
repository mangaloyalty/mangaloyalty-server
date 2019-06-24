import puppeteer from 'puppeteer';
import * as app from '../..';
import * as seriesDetail from './evaluators/seriesDetail';
import * as seriesList from './evaluators/seriesList';
const baseUrl = 'https://fanfox.net';

export const fanfoxProvider = {
  isSupported(url: string) {
    return url.startsWith(baseUrl);
  },

  async popularAsync(pageNumber?: number) {
    return await app.browserHelper.usingPageAsync(async (page) => {
      const watch = new app.WatchComponent(page);
      await page.goto(`${baseUrl}/directory/${pageNumber && pageNumber > 1 ? `${pageNumber}.html` : ''}`);
      const results = await page.evaluate(seriesList.evaluator);
      await watch.resolveOrDeleteAsync('image', ...results);
      return results;
    });
  },

  async searchAsync(title: string, pageNumber?: number) {
    return await app.browserHelper.usingPageAsync(async (page) => {
      const watch = new app.WatchComponent(page);
      await page.goto(`${baseUrl}/search?title=${encodeURIComponent(title)}${pageNumber && pageNumber > 1 ? `&page=${pageNumber}` : ''}`);
      const results = await page.evaluate(seriesList.evaluator);
      await watch.resolveOrDeleteAsync('image', ...results);
      return results;
    });
  },

  async seriesAsync(url: string) {
    return await app.browserHelper.usingPageAsync(async (page) => {
      const watch = new app.WatchComponent(page);
      await page.goto(url);
      await ensureAdultAsync(page);
      const result = await page.evaluate(seriesDetail.evaluator);
      await watch.resolveOrDeleteAsync('image', result);
      return result;
    });
  },

  async startAsync(url: string) {
    const runner = new app.FanfoxRunnerComponent(url).run();
    const session = await runner.getAsync();
    app.sessionManager.add(session);
    return session;
  }
};

async function ensureAdultAsync(page: puppeteer.Page) {
  const waitPromise = page.waitForNavigation();
  if (await page.evaluate(seriesDetail.shouldWaitAdultEvaluator)) await waitPromise;
  else waitPromise.catch(() => undefined);
}
