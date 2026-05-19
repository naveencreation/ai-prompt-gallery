export interface Logger {
  info(msg: string, meta?: object): void
  warn(msg: string, meta?: object): void
  error(msg: string, meta?: object): void
}

export class ConsoleLogger implements Logger {
  private log(level: string, msg: string, meta?: object) {
    console.log(JSON.stringify({ level, msg, ...meta, ts: new Date().toISOString() }))
  }
  info(msg: string, meta?: object) { this.log('info', msg, meta) }
  warn(msg: string, meta?: object) { this.log('warn', msg, meta) }
  error(msg: string, meta?: object) { this.log('error', msg, meta) }
}

export const logger: Logger = new ConsoleLogger()
