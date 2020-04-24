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
    this._timeoutHandle = setTimeout(() => this.tryRun(), app.settings.libraryAutomationTimeout);
  }

  private async _runWithTraceAsync() {
    try {
      await seriesAsync();
    } catch (error) {
      app.writeError(error);
    }
  }
}

function computeNext(series: app.ILibrarySeries) {
  switch (series.automation.frequency) {
    case 'hourly': return (series.automation.checkedAt || 0) + 3600000;
    case 'daily': return (series.automation.checkedAt || 0) + 86400000;
    case 'weekly': return (series.automation.checkedAt || 0) + 604800000;
    case 'monthly': return (series.automation.checkedAt || 0) + 2419200000;
    default: return Number.MAX_VALUE;
  }
}

async function seriesAsync() {
  for (const listItem of await app.core.library.listAsync('all', 'all', 'lastPageReadAt')) try {
    const series = await app.core.library.seriesReadAsync(listItem.id);
    if (!series || computeNext(series) > Date.now()) continue;
    app.writeInfo(`[Automation] Fetching ${series.source.title}`);
    if (await app.core.library.seriesUpdateAsync(series.id)) {
      await seriesChaptersAsync(series);
      app.writeInfo(`[Automation] Finished ${series.source.title}`);
      await trackAsync(series.id);
    } else {
      app.writeInfo(`[Automation] Rejected ${series.source.title}`);
    }
  } catch (error) {
    app.writeError(error);
  }
}

async function seriesChaptersAsync(series: app.ILibrarySeries) {
  for (const chapter of series.chapters.slice().reverse().filter((chapter) => !chapter.syncAt)) try {
    if (series.automation.strategy !== 'all' && (series.automation.strategy !== 'unread' || chapter.isReadCompleted)) continue;
    app.writeInfo(`[Automation] Fetching ${series.source.title} -> ${chapter.title}`);
    const session = await app.core.library.chapterReadAsync(series.id, chapter.id);
    const success = session instanceof app.SessionRunnable && await session.waitFinishedAsync().then(() => true, () => false);
    app.writeInfo(`[Automation] ${success ? 'Finished' : 'Rejected'} ${series.source.title} -> ${chapter.title}`);
  } catch (error) {
    app.writeError(error);
  }
}

async function trackAsync(seriesId: string) {
  await app.core.library.context.lockSeriesAsync(seriesId, async (seriesContext) => {
    try {
      const series = await seriesContext.getAsync();
      series.automation.checkedAt = Date.now();
      await seriesContext.saveAsync();
    } catch (error) {
      if (error && error.code === 'ENOENT') return;
      throw error;
    }
  });
}
