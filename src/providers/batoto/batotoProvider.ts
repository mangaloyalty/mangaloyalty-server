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
      await watch.resolveOrDeleteAsync('image', ...results.items);
      return results;
    });
  },

  async searchAsync(title: string, pageNumber?: number) {
    return await app.core.browser.pageAsync(async (page) => {
      const watch = new app.Watch(page);
      await page.goto(`${baseUrl}/search?q=${encodeURIComponent(title)}${pageNumber && pageNumber > 1 ? `&a=&p=${pageNumber}` : ''}`, {waitUntil: 'domcontentloaded'});
      const results = await page.evaluate(seriesList.evaluator);
      await watch.resolveOrDeleteAsync('image', ...results.items);
      return results;
    });
  },

  async seriesAsync(url: string) {
    return await app.core.browser.pageAsync(async (page) => {
      const watch = new app.Watch(page);
      await page.goto(url, {waitUntil: 'domcontentloaded'});
      const result = await page.evaluate(seriesDetail.evaluator);
      await watch.resolveOrDeleteAsync('image', result);
      return result;
    });
  },

  async startAsync(url: string) {
    const runner = new Runner(url).run();
    const session = await runner.getAsync();
    app.core.session.add(session);
    return session;
  }
};
