export class FutureComponent<T> {
  private readonly _timeout: number;
  private _hasReject: boolean;
  private _hasResolve: boolean;
  private _reject?: Error;
  private _resolve?: T;
  private _resolver: (error?: Error, result?: T) => void;

  constructor(timeout = 0) {
    this._hasReject = false;
    this._hasResolve = false;
    this._resolver = () => undefined;
    this._timeout = timeout;
  }

  async getAsync() {
    return new Promise<T>((resolve, reject) => {
      if (this._hasReject) {
        reject(this._reject);
      } else if (this._hasResolve) {
        resolve(this._resolve);
      } else if (this._timeout) {
        setTimeout(reject, this._timeout);
        this._ensure(resolve, reject);
      } else {
        this._ensure(resolve, reject);
      }
		});
  }

  reject(error?: Error) {
    if (this._hasReject || this._hasResolve) return;
    this._hasReject = true;
    this._reject = error;
    this._resolver(error);
  }

  resolve(result: T) {
    if (this._hasReject || this._hasResolve) return;
    this._hasResolve = true;
		this._resolve = result;
    this._resolver(undefined, result);
  }
  
  private _ensure(resolve: (result: T) => void, reject: (error?: Error) => void) {
    const previousResolver = this._resolver;
    this._resolver = (error, result) => {
      if (result) {
        previousResolver(error, result);
        resolve(result);
      } else {
        previousResolver(error);
        reject(error);
      }
    };
  }
}
