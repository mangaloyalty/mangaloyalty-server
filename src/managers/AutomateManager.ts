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
      const result = await app.core.library.listAsync('addedAt', undefined, pageNumber);
      for (const item of result.items) await this._seriesAsync(item);
      if (!result.hasMorePages) break;
    }
  }

  private async _seriesAsync(item: app.ILibraryListItem) {
    const detail = await app.core.library.seriesReadAsync(item.id);
    const nextSyncAt = detail && calculateNextSync(detail);
    if (detail && nextSyncAt && nextSyncAt <= Date.now()) {
      console.log(`[Automation] Fetching ${detail.series.title}`);
      const updatedDetail = await app.core.library.seriesUpdateAsync(detail.id);
      if (updatedDetail && updatedDetail.automation.sync) await this._chapterAsync(updatedDetail);
      console.log(`[Automation] Finished ${detail.series.title}`);
    }
  }
  
  private async _chapterAsync(detail: app.ILibraryDetail) {
    for (const chapter of detail.chapters.reverse()) {
      if (chapter.syncAt) continue;
      console.log(`[Automation] Fetching ${detail.series.title} -> ${chapter.title}`);
      const session = await app.core.library.chapterUpdateAsync(detail.id, chapter.id);
      if (session && await session.waitFinishedAsync()) {
        console.log(`[Automation] Finished ${detail.series.title} -> ${chapter.title}`);
      } else {
        console.log(`[Automation] Rejected ${detail.series.title} -> ${chapter.title}`);
      }
    }
  }
}

function calculateNextSync(detail: app.ILibraryDetail) {
  switch (detail.automation.frequency) {
    case 'hourly': return detail.lastSyncAt + 3600000;
    case 'daily': return detail.lastSyncAt + 86400000;
    case 'weekly': return detail.lastSyncAt + 604800000;
    default: return Number.MAX_SAFE_INTEGER;
  }
}
