import * as app from '..';
import * as path from 'path';

export class LibraryContextSeries {
  private readonly _onExpire: () => void;
  private readonly _seriesId: string;
  private _hasExpired?: boolean;
  private _series?: Promise<app.IFileSeries>;
  private _seriesPath?: string;

  constructor(onExpire: () => void, seriesId: string) {
    this._onExpire = onExpire;
    this._seriesId = seriesId;
  }

  expire() {
    if (this._hasExpired) return;
    this._hasExpired = true;
    this._onExpire();
  }

  async getAsync() {
    try {
      if (this._series) return await this._series;
      this._seriesPath = path.join(app.settings.library, this._seriesId, app.settings.librarySeries);
      this._series = this._readAsync(this._seriesPath);
      return await this._series;
    } catch (error) {
      if (error && error.code === 'ENOENT') this.expire();
      delete this._series;
      delete this._seriesPath;
      throw error;
    }
  }

  async saveAsync() {
    try {
      if (!this._series || !this._seriesPath) throw new Error();
      const series = await this._series;
      await app.core.resource.writeFileAsync(this._seriesPath, series);
    } catch (error) {
      delete this._series;
      delete this._seriesPath;
      throw error;
    }
  }

  private async _readAsync(seriesPath: string) {
    const series = await app.core.resource.readJsonAsync<app.IFileSeries>(seriesPath);
    await migrations.v080(series, seriesPath);
    return series;
  }
}

const migrations = {
  v080: async (series: any, seriesPath: string) => {
    if (typeof series.automation.syncAll !== 'boolean') return;
    series.automation.strategy = series.automation.syncAll ? 'all' : 'none';
    delete series.automation.syncAll;
    await app.core.resource.writeFileAsync(seriesPath, series);
  }
};
