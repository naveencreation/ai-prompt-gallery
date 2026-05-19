interface CursorPayload {
  createdAt: string
  id: string
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as CursorPayload
  } catch {
    throw new Error('Invalid cursor')
  }
}
