import * as app from '.';
import * as express from 'express';
import * as winston from 'winston';
import {randomBytes} from 'crypto';
let logger: winston.Logger | undefined;

export function createPageName(value: number) {
  let result = String(value);
  while (result.length < 3) result = `0${result}`;
  return result;
}

export function createUniqueId() {
  const buffer = randomBytes(24);
  buffer.writeBigUInt64LE(BigInt(Date.now()))
  return buffer.toString('hex');
}

export function detectImage(image: Buffer) {
  if (image.slice(0, 3).toString('hex') === '474946') return {contentType: 'image/gif', extension: 'gif'};
  if (image.slice(0, 2).toString('hex') === 'ffd8') return {contentType: 'image/jpeg', extension: 'jpg'};
  if (image.slice(0, 4).toString('hex') === '89504e47') return {contentType: 'image/png', extension: 'png'};
  if (image.slice(0, 4).toString('hex') === '52494646') return {contentType: 'image/webp', extension: 'webp'};
  return;
}

export function httpCache(timeout: number) {
  const key = 'Cache-Control';
  const value = `public, max-age=${Math.floor(timeout / 1000)}`;
  return (_: express.Request, res: express.Response, next: express.NextFunction) => Boolean(res.set(key, value)) && next();
}

export function httpImage(image: Buffer) {
  const imageType = detectImage(image);
  return (_: express.Request, res: express.Response) => {
    res.type(imageType ? imageType.contentType : 'application/octet-stream');
    res.status(200);
    res.send(image);
  };
}

export function writeError(error: any) {
  if (error instanceof Error) writeInfo(error.stack || error.message);
  else if (error && String(error)) writeError(new Error(String(error)));
  else writeError(new Error());
}

export function writeInfo(message: string) {
  (logger || (logger = winston.createLogger({
    format: winston.format.combine(winston.format.timestamp(), winston.format.printf((x) => `${x.timestamp}: ${x.message}`)),
    transports: [new winston.transports.Console(), new winston.transports.File({filename: app.settings.logger})]
  }))).info(message);
}
