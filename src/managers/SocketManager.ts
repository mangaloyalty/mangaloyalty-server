import * as app from '..';

export class SocketManager implements app.ISocketManager {
  private readonly _handlers: ((action: app.ISocketAction) => void)[];

  constructor() {
    this._handlers = [];
  }

  addEventListener(handler: (action: app.ISocketAction) => void) {
    this._handlers.push(handler);
  }

  removeEventListener(handler: (action: app.ISocketAction) => void) {
    const index = this._handlers.indexOf(handler);
    if (index !== -1) this._handlers.splice(index, 1);
  }

  emit(action: app.ISocketAction) {
    for (const handler of this._handlers) try {
      handler(action);
    } catch (error) {
      app.core.trace.error(error);
    }
  }
}
