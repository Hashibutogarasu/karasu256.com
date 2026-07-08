/**
 * Thrown when a required environment variable is not set at runtime.
 *
 * @param variableName - The name of the missing environment variable.
 */
export class MissingEnvError extends Error {
  readonly variableName: string;

  constructor(variableName: string) {
    super(`Missing required environment variable: ${variableName}`);
    this.name = 'MissingEnvError';
    this.variableName = variableName;
  }
}
