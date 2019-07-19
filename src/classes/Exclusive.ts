import * as app from '..';

// TODO: CLean me up.
export class Exclusive {
  private _waitPromise: Promise<{error?: Error, value?: any}>;

  constructor() {
    this._waitPromise = Promise.resolve<{error?: Error, value?: any}>({});
  }

  async acquireAsync<T>(runAsync: () => Promise<T>) {
    this._waitPromise = this._waitPromise.then(() => handlerAsync(runAsync));
    const result = await this._waitPromise;
    if (result.error) throw result.error;
    return result.value as T;
  }
}

async function handlerAsync<T>(runAsync: () => Promise<T>) {
  try {
    return {value: await runAsync()};
  } catch (error) {
    return {error: app.errorManager.create(error)};
  }
}
