import * as app from '..';

export class AutomateManager {
  private _isRunning?: boolean;
  private _timeoutHandle?: NodeJS.Timer;

  tryRun() {
    if (this._isRunning) return;
    this._isRunning = true;
    this._cancelSchedule();
    this._runWithTraceAsync().then(() => {
      this._isRunning = false;
      this._reschedule();
    });
  }

  private _cancelSchedule() {
    if (!this._timeoutHandle) return;
    clearTimeout(this._timeoutHandle);
    delete this._timeoutHandle;
  }

  private _reschedule() {
    this._cancelSchedule();
    this._timeoutHandle = setTimeout(() => this.tryRun(), app.settings.libraryAutomationInterval);
  }

  private async _runWithTraceAsync() {
    try {
      await runAsync();
    } catch (error) {
      app.traceError(error);
    }
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

async function runAsync() {
  const items = await app.core.library.listAsync('all', 'all', 'addedAt', undefined);
  for (const item of items) await seriesAsync(item);
}

async function seriesAsync(item: app.ILibraryListItem) {
  const series = await app.core.library.seriesReadAsync(item.id);
  const nextAt = series && computeNextAt(series);
  if (series && nextAt && nextAt <= Date.now()) {
    console.log(`[Automation] Fetching ${series.source.title}`);
    if (await app.core.library.seriesUpdateAsync(series.id)) await seriesChaptersAsync(series.id);
    console.log(`[Automation] Finished ${series.source.title}`);
    await trackCheckedAsync(item.id);
  }
}

async function seriesChaptersAsync(seriesId: string) {
  const series = await app.core.library.seriesReadAsync(seriesId);
  const chapter = series && series.chapters.slice().reverse().find((chapter) => !chapter.syncAt);
  if (series && series.automation.syncAll && chapter) {
    console.log(`[Automation] Fetching ${series.source.title} -> ${chapter.title}`);
    const session = await app.core.library.chapterReadAsync(series.id, chapter.id);
    if (session instanceof app.SessionRunnable && await session.waitFinishedAsync()) {
      console.log(`[Automation] Finished ${series.source.title} -> ${chapter.title}`);
      await seriesChaptersAsync(seriesId);
    } else {
      console.log(`[Automation] Rejected ${series.source.title} -> ${chapter.title}`);
      await seriesChaptersAsync(seriesId);
    }
  }
}

async function trackCheckedAsync(seriesId: string) {
  await app.core.library.accessContext().lockSeriesAsync(seriesId, async (seriesContext) => {
    const series = await seriesContext.getAsync();
    series.automation.checkedAt = Date.now();
    await seriesContext.saveAsync();
  });
}
