import * as app from '..';

export class SocketManager {
  private readonly _handlers: ((action: app.ISocketAction) => Promise<void>)[];
  private _queue: Promise<void>;

  constructor() {
    this._handlers = [];
    this._queue = Promise.resolve();
  }

  addEventListener(handleAsync: (action: app.ISocketAction) => Promise<void>) {
    this._handlers.push(handleAsync);
  }

  removeEventHandler(handleAsync: (action: app.ISocketAction) => Promise<void>) {
    const index = this._handlers.indexOf(handleAsync);
    if (index !== -1) this._handlers.splice(index, 1);
  }

  async queueAsync(action: app.ISocketAction) {
    return await (this._queue = this._queue.then(async () => {
      for (const handleAsync of this._handlers) {
        try {
          await handleAsync(action);
        } catch (error) {
          app.traceError(error);
        }
      }
    }));
  }
}
