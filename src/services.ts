import * as express from 'express';
import {randomBytes} from 'crypto';

export function cacheOperation(timeout: number) {
  const key = 'Cache-Control';
  const value = `public, max-age=${Math.floor(timeout / 1000)}`;
  return (_: express.Request, res: express.Response, next: express.NextFunction) => Boolean(res.set(key, value)) && next();
}

export function createPrefix(value: number, length: number) {
  let result = String(value);
  while (result.length < length) result = `0${result}`;
  return result;
}

export function createUniqueId() {
  const buffer = randomBytes(24);
  buffer.writeBigUInt64LE(BigInt(Date.now()))
  return buffer.toString('hex');
}

export function imageContentType(image: Buffer) {
  switch (image.slice(0, 2).toString('hex')) {
    case '4749': return 'image/gif';
    case 'ffd8': return 'image/jpeg';
    case '8950': return 'image/png';
    default: throw new Error();
  }
}

export function traceError(error?: any) {
  if (error instanceof Error) console.log(error);
  else if (error) return console.log(new Error(String(error) || ''));
  else console.log(new Error());
}
