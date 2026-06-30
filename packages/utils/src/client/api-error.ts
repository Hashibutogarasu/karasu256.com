/**
 * Thrown when an API fetch completes with a non-ok HTTP status.
 *
 * @param status - The HTTP status code returned by the server.
 * @param code - A machine-readable error code suitable for i18n lookup.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(`API error ${status}: ${code}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  /** Creates an {@link ApiError} whose code is derived from the HTTP status. */
  static fromResponse(response: Response): ApiError {
    return new ApiError(response.status, codeFromStatus(response.status));
  }
}

function codeFromStatus(status: number): string {
  if (status === 400) return "bad_request";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status >= 500) return "server_error";
  return "unknown";
}
