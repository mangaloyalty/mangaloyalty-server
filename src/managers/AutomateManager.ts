import * as app from '..';

export class AutomateManager {
  async runWithTraceAsync() {
    try {
      await this._allAsync();
    } catch (error) {
      app.traceError(error);
    } finally {
      this.schedule();
    }
  }

  schedule() {
    setTimeout(() => {
      this.runWithTraceAsync();
    }, app.settings.libraryAutomationInterval);
  }

  private async _allAsync() {
    for (let pageNumber = 1; ; pageNumber++) {
      const result = await app.core.library.listAsync('all', 'all', 'addedAt', undefined, pageNumber);
      for (const item of result.items) await this._seriesAsync(item);
      if (!result.hasMorePages) break;
    }
  }

  private async _seriesAsync(item: app.ILibraryListItem) {
    const series = await app.core.library.seriesReadAsync(item.id);
    const nextAt = series && computeNextAt(series);
    if (series && nextAt && nextAt <= Date.now()) {
      console.log(`[Automation] Fetching ${series.source.title}`);
      if (await app.core.library.seriesUpdateAsync(series.id)) await this._seriesChaptersAsync(series.id);
      console.log(`[Automation] Finished ${series.source.title}`);
      await this._trackCheckedAsync(item.id);
    }
  }
  
  private async _seriesChaptersAsync(seriesId: string) {
    const series = await app.core.library.seriesReadAsync(seriesId);
    const chapter = series && series.chapters.slice().reverse().find((chapter) => !chapter.syncAt);
    if (series && series.automation.syncAll && chapter) {
      console.log(`[Automation] Fetching ${series.source.title} -> ${chapter.title}`);
      const session = await app.core.library.chapterReadAsync(series.id, chapter.id);
      if (session instanceof app.SessionRunnable && await session.waitFinishedAsync()) {
        console.log(`[Automation] Finished ${series.source.title} -> ${chapter.title}`);
        await this._seriesChaptersAsync(seriesId);
      } else {
        console.log(`[Automation] Rejected ${series.source.title} -> ${chapter.title}`);
        await this._seriesChaptersAsync(seriesId);
      }
    }
  }

  private async _trackCheckedAsync(seriesId: string) {
    await app.core.library.accessContext().lockSeriesAsync(seriesId, async (seriesContext) => {
      const series = await seriesContext.getAsync();
      series.automation.checkedAt = Date.now();
      await seriesContext.saveAsync();
    });
  }
}

function computeNextAt(series: app.ILibrarySeries) {
  switch (series.automation.frequency) {
    case 'hourly': return (series.automation.checkedAt || 0) + 3600000;
    case 'daily': return (series.automation.checkedAt || 0) + 86400000;
    case 'weekly': return (series.automation.checkedAt || 0) + 604800000;
    case 'monthly': return (series.automation.checkedAt || 0) + 2419200000;
    default: return Number.MAX_VALUE;
  }
}
