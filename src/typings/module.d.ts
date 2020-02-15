declare module 'zip-stream' {
  class Packer extends NodeJS.EventEmitter {
    constructor(options?: {store: boolean});
    entry(value: Buffer | null, {name: string}, callback: (error?: any) => void);
    finish();
    pipe<T extends NodeJS.WritableStream>(destination: T): T;
  }

  export = Packer;
}
