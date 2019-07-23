import {randomBytes} from 'crypto';

export function createUniqueId() {
  const buffer = randomBytes(24);
  buffer.writeBigUInt64LE(BigInt(Date.now()))
  return buffer.toString('hex');
}

export function createZeroPadding(value: number | string, length: number) {
  let result = String(value);
  while (result.length < length) result = `0${result}`;
  return result;
}
