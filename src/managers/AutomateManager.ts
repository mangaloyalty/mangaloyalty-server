import * as app from '..';

export class AutomateManager {
  async runWithTraceAsync() {
    try {
      await this._mainAsync();
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

  private async _mainAsync() {
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
      console.log(`[Automation] Updating ${series.source.title}`);
      const updatedSeries = await app.core.library.seriesUpdateAsync(series.id);
      if (updatedSeries && updatedSeries.automation.syncAll) await this._chapterAsync(updatedSeries);
    }
  }
  
  private async _chapterAsync(series: app.ILibrarySeries) {
    for (const chapter of series.chapters.reverse()) {
      if (chapter.syncAt) continue;
      console.log(`[Automation] Fetching ${series.source.title} -> ${chapter.title}`);
      const session = await app.core.library.chapterUpdateAsync(series.id, chapter.id);
      if (session && await session.waitFinishedAsync()) {
        console.log(`[Automation] Finished ${series.source.title} -> ${chapter.title}`);
      } else {
        console.log(`[Automation] Rejected ${series.source.title} -> ${chapter.title}`);
      }
    }
  }
}

function computeNextAt(series: app.ILibrarySeries) {
  switch (series.automation.frequency) {
    case 'hourly': return series.lastSyncAt + 3600000;
    case 'daily': return series.lastSyncAt + 86400000;
    case 'weekly': return series.lastSyncAt + 604800000;
    default: return undefined;
  }
}
