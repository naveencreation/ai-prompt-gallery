export interface RateLimit {
  check(key: string, limit: number, windowSec: number): Promise<boolean>
}
