import * as api from 'express-openapi-json';
import {randomBytes} from 'crypto';



export function createPageName(value: number) {
  let result = String(value);
  while (result.length < 3) result = `0${result}`;
  return result;
}

export function createUniqueId() {
  const now = Date.now().toString(16);
  const random = randomBytes(24).toString('hex');
  return now + random;
}

export function imageDetect(image: Buffer) {
  if (image.slice(0, 3).toString('hex') === '474946') return {contentType: 'image/gif', extension: 'gif'};
  if (image.slice(0, 2).toString('hex') === 'ffd8') return {contentType: 'image/jpeg', extension: 'jpg'};
  if (image.slice(0, 4).toString('hex') === '89504e47') return {contentType: 'image/png', extension: 'png'};
  if (image.slice(0, 4).toString('hex') === '52494646') return {contentType: 'image/webp', extension: 'webp'};
  return;
}

export function imageResult(image: Buffer, timeout: number) {
  const cacheControl = `public, max-age=${Math.floor(timeout / 1000)}`;
  const contentType = imageDetect(image)?.contentType || 'application/octet-stream';
  return api.content(image, 200, {'Cache-Control': cacheControl, 'Content-Type': contentType});
}
