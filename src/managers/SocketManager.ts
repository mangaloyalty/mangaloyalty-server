import * as app from '..';

export class SocketManager {
  private readonly _handlers: ((action: app.ISocketAction) => void)[];

  constructor() {
    this._handlers = [];
  }

  addEventListener(handler: (action: app.ISocketAction) => void) {
    this._handlers.push(handler);
  }

  removeEventHandler(handler: (action: app.ISocketAction) => void) {
    const index = this._handlers.indexOf(handler);
    if (index !== -1) this._handlers.splice(index, 1);
  }

  emit(action: app.ISocketAction) {
    for (const handler of this._handlers) {
      try {
        handler(action);
      } catch (error) {
        app.writeError(error);
      }
    }
  }
}
