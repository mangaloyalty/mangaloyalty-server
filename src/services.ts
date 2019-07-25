import {randomBytes} from 'crypto';

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

export function traceError(error?: any) {
  if (error instanceof Error) console.log(error);
  else if (error) return console.log(new Error(String(error) || ''));
  else console.log(new Error());
}
