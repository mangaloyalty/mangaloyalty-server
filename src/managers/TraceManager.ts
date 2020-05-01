import * as app from '..';
import * as winston from 'winston';

export class TraceManager implements app.ITraceManager {
  private _logger?: winston.Logger;

  error(error: any) {
    if (error instanceof Error) this.info(error.stack || error.message);
    else if (error && String(error)) this.error(new Error(String(error)));
    else this.error(new Error());
  }

  info(message: string) {
    (this._logger || (this._logger = winston.createLogger({
      format: winston.format.combine(winston.format.timestamp(), winston.format.printf((x) => `${x.timestamp}: ${x.message}`)),
      transports: [new winston.transports.Console(), new winston.transports.File({filename: app.settings.logger})]
    }))).info(message);
  }
}
