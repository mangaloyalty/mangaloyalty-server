import * as app from '.';
import * as express from 'express';
import * as winston from 'winston';
import {randomBytes} from 'crypto';
let logger: winston.Logger | undefined;

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
  if (image.slice(0, 3).toString('hex') === '474946') return 'image/gif';
  if (image.slice(0, 2).toString('hex') === 'ffd8') return 'image/jpeg';
  if (image.slice(0, 4).toString('hex') === '89504e47') return 'image/png';
  if (image.slice(0, 4).toString('hex') === '52494646') return 'image/webp';
  return;
}

export function imageExtension(image: Buffer) {
  if (image.slice(0, 3).toString('hex') === '474946') return 'gif';
  if (image.slice(0, 2).toString('hex') === 'ffd8') return 'jpg';
  if (image.slice(0, 4).toString('hex') === '89504e47') return 'png';
  if (image.slice(0, 4).toString('hex') === '52494646') return 'webp';
  return;
}

export function httpCache(timeout: number) {
  const key = 'Cache-Control';
  const value = `public, max-age=${Math.floor(timeout / 1000)}`;
  return (_: express.Request, res: express.Response, next: express.NextFunction) => Boolean(res.set(key, value)) && next();
}

export function httpImage(image: Buffer) {
  return (_: express.Request, res: express.Response) => {
    res.type(imageContentType(image) || 'application/octet-stream');
    res.status(200);
    res.send(image);
  };
}

export function writeError(error?: any) {
  if (error instanceof Error) writeInfo(error.stack || error.message);
  else if (error) writeError(new Error(String(error) || ''));
  else writeError(new Error());
}

export function writeInfo(message: string) {
  (logger || (logger = winston.createLogger({
    format: winston.format.combine(winston.format.timestamp(), winston.format.printf((x) => `${x.timestamp}: ${x.message}`)),
    transports: [new winston.transports.Console(), new winston.transports.File({filename: app.settings.logger})]
  }))).info(message);
}
