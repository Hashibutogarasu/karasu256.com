/** Logs a structured, greppable info-level event as a single JSON line. */
export function logInfo(event: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ event, ...data }));
}

/** Logs a structured, greppable error-level event as a single JSON line. */
export function logError(event: string, data: Record<string, unknown> = {}): void {
  console.error(JSON.stringify({ event, ...data }));
}
