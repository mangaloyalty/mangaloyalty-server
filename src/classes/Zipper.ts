import Packer from 'zip-stream';

export class Zipper {
  private readonly _packer: Packer;

  private constructor(packer: Packer) {
    this._packer = packer;
  }

  static createAsync(writableStream: NodeJS.WritableStream, runAsync: (zipper: Zipper) => Promise<void>) {
    const packer = new Packer({store: true});
    return new Promise(async (resolve, reject) => {
      try {
        packer.on('error', (error) => reject(error));
        packer.pipe(writableStream);
        await runAsync(new Zipper(packer));
      } catch (error) {
        packer.finish();
        reject(error);
      } finally {
        packer.finish();
        resolve();
      }
    });
  }

  directoryAsync(name: string) {
    return new Promise((resolve, reject) => {
      this._packer.entry(null, {name: `${name}/`}, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  fileAsync(name: string, value: Buffer) {
    return new Promise((resolve, reject) => {
      this._packer.entry(value, {name}, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}
