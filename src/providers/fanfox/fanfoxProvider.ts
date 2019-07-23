import puppeteer from 'puppeteer';
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
      await page.goto(`${baseUrl}/directory/${pageNumber && pageNumber > 1 ? `${pageNumber}.html` : ''}`, {waitUntil: 'domcontentloaded'});
      const results = await page.evaluate(seriesList.evaluator);
      await watch.resolveOrDeleteAsync('image', ...results.items);
      return results;
    });
  },

  async searchAsync(title: string, pageNumber?: number) {
    return await app.core.browser.pageAsync(async (page) => {
      const watch = new app.Watch(page);
      await page.goto(`${baseUrl}/search?title=${encodeURIComponent(title)}${pageNumber && pageNumber > 1 ? `&page=${pageNumber}` : ''}`, {waitUntil: 'domcontentloaded'});
      const results = await page.evaluate(seriesList.evaluator);
      await watch.resolveOrDeleteAsync('image', ...results.items);
      return results;
    });
  },

  async seriesAsync(url: string) {
    return await app.core.browser.pageAsync(async (page) => {
      const watch = new app.Watch(page);
      await page.goto(url, {waitUntil: 'domcontentloaded'});
      await ensureAdultAsync(page);
      const result = await page.evaluate(seriesDetail.evaluator);
      await watch.resolveOrDeleteAsync('image', result);
      return result;
    });
  },

  async startAsync(adaptor: app.IAdaptor, url: string) {
    const session = app.core.session.add(new app.SessionRunnable(adaptor, url));
    new Runner(session, url).runAsync();
    return await session.waitAsync();
  }
};

async function ensureAdultAsync(page: puppeteer.Page) {
  const waitPromise = page.waitForNavigation();
  if (await page.evaluate(seriesDetail.shouldWaitAdultEvaluator)) await waitPromise;
  else waitPromise.catch(() => undefined);
}
