export interface ErrorReporter {
  capture(err: unknown, ctx?: object): void
}

export class ConsoleErrorReporter implements ErrorReporter {
  capture(err: unknown, ctx?: object) {
    console.error(JSON.stringify({
      level: 'error',
      err: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      ...ctx,
      ts: new Date().toISOString(),
    }))
  }
}

export const errors: ErrorReporter = new ConsoleErrorReporter()
