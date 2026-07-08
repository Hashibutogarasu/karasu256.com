/**
 * Base class for passkey authentication errors.
 * Subclasses register themselves via {@link PasskeyError.register} so that
 * {@link PasskeyError.fromCode} can instantiate the correct type from a
 * server-returned error code without any external mapping structure.
 */
export abstract class PasskeyError extends Error {
  abstract readonly i18nKey: string;

  private static readonly registry = new Map<string, new () => PasskeyError>();

  constructor() {
    super();
    this.name = this.constructor.name;
  }

  /**
   * Associates a server error code with an error class.
   * Call this immediately after each subclass definition.
   */
  static register(code: string, cls: new () => PasskeyError): void {
    PasskeyError.registry.set(code, cls);
  }

  /**
   * Returns a new instance of the error class registered for the given code,
   * or `null` when the code is unrecognised.
   */
  static fromCode(code: string): PasskeyError | null {
    const Cls = PasskeyError.registry.get(code);
    return Cls ? new Cls() : null;
  }
}

/** The WebAuthn credential was not found in the database. */
export class CredentialNotFoundError extends PasskeyError {
  readonly i18nKey = 'passkey.error.credential_not_found';
}
PasskeyError.register('credential_not_found', CredentialNotFoundError);

/** The WebAuthn assertion failed server-side verification. */
export class VerificationFailedError extends PasskeyError {
  readonly i18nKey = 'passkey.error.verification_failed';
}
PasskeyError.register('verification_failed', VerificationFailedError);

/** The Firebase user associated with the credential no longer exists. */
export class PasskeyUserNotFoundError extends PasskeyError {
  readonly i18nKey = 'passkey.error.user_not_found';
}
PasskeyError.register('user_not_found', PasskeyUserNotFoundError);

/** Thrown for unrecognised server codes or unexpected response shapes. */
export class UnknownPasskeyError extends PasskeyError {
  readonly i18nKey = 'passkey.error.unknown';
}
