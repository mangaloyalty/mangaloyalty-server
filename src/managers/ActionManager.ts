import * as app from '..';

export class ActionManager implements app.IActionManager {
  private readonly _actions: app.IActionListItem[];
  private readonly _futures: app.Future<app.IActionListItem>[];
  
  constructor() {
    this._actions = [];
    this._futures = [];
  }

  emit(data: app.IActionListItemData) {
    const addedAt = this._addedAt();
    const action = {addedAt, data};
    this._actions.push(action);
    this._resolve(action);
  }

  get(previousResponseAt?: number) {
    this._expire();
    const items = previousResponseAt ? this._actions.filter(x => x.addedAt > previousResponseAt) : this._actions;
    const responseAt = Date.now();
    return {items, responseAt};
  }

  async waitAsync() {
    const future = new app.Future<app.IActionListItem>(app.settings.actionWaitTimeout);
    try {
      this._futures.push(future);
      const items = [await future.getAsync()];
      const responseAt = Date.now();
      return {items, responseAt};
    } catch (error) {
      const items: app.IActionListItem[] = [];
      const responseAt = Date.now();
      return {items, responseAt};
    } finally {
      const index = this._futures.indexOf(future);
      if (index !== -1) this._futures.splice(index, 1);
    }
  }
  
  private _addedAt() {
    const addedAt = Date.now();
    const lastAction = this._actions[this._actions.length - 1];
    return lastAction && lastAction.addedAt >= addedAt ? lastAction.addedAt + 1 : addedAt;
  }

  private _expire() {
    while (this._actions.length) {
      const action = this._actions[0];
      if (action.addedAt + app.settings.actionExpireTimeout >= Date.now()) break;
      this._actions.shift();
    }
  }

  private _resolve(action: app.IActionListItem) {
    this._expire();
    this._futures.forEach((future) => future.resolve(action));
    this._futures.splice(0, this._futures.length);
  }
}
