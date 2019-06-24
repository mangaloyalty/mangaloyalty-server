import * as app from '../..';
import * as seriesDetail from './evaluators/seriesDetail';
import * as seriesList from './evaluators/seriesList';
const baseUrl = 'https://bato.to';

export const batotoProvider = {
  isSupported(url: string) {
    return url.startsWith(baseUrl);
  },

  async popularAsync(pageNumber?: number) {
    return await app.browserHelper.usingPageAsync(async (page) => {
      const watch = new app.WatchComponent(page);
      await page.goto(`${baseUrl}/browse?langs=english${pageNumber && pageNumber > 1 ? `&page=${pageNumber}` : ''}`);
      const results = await page.evaluate(seriesList.evaluator);
      await watch.resolveOrDeleteAsync('image', ...results);
      return results;
    });
  },

  async searchAsync(title: string, pageNumber?: number) {
    return await app.browserHelper.usingPageAsync(async (page) => {
      const watch = new app.WatchComponent(page);
      await page.goto(`${baseUrl}/search?q=${encodeURIComponent(title)}${pageNumber && pageNumber > 1 ? `&a=&p=${pageNumber}` : ''}`);
      const results = await page.evaluate(seriesList.evaluator);
      await watch.resolveOrDeleteAsync('image', ...results);
      return results;
    });
  },

  async seriesAsync(url: string) {
    return await app.browserHelper.usingPageAsync(async (page) => {
      const watch = new app.WatchComponent(page);
      await page.goto(url);
      const result = await page.evaluate(seriesDetail.evaluator);
      await watch.resolveOrDeleteAsync('image', result);
      return result;
    });
  },

  async startAsync(url: string) {
    const runner = new app.BatotoRunnerComponent(url).run();
    const session = await runner.getAsync();
    app.sessionManager.add(session);
    return session;
  }
};
