/**
 * Base error class for all Pockity application errors
 * Provides consistent error structure and HTTP status code handling
 */
export class PockityBaseErrorClass extends Error {
  /** HTTP status code associated with this error */
  httpStatusCode: number;
  /** Additional error details (validation errors, stack traces, etc.) */
  details: any;

  /**
   * Creates a new Pockity error instance
   * @param params - Error parameters
   * @param params.message - Error message
   * @param params.httpStatusCode - HTTP status code (defaults to 500)
   * @param params.details - Additional error details
   */
  constructor({ message, httpStatusCode, details }: { message: string; httpStatusCode?: number; details?: any }) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.httpStatusCode = httpStatusCode || 500;
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts the error to a plain JSON object for API responses
   * @returns Plain object representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      details: this.details,
      httpStatusCode: this.httpStatusCode,
    };
  }
}

/**
 * Authentication error class for login/authentication failures
 */
export class PockityErrorAuthentication extends PockityBaseErrorClass {
  constructor({ message, httpStatusCode }: { message: string; httpStatusCode: number }) {
    super({ message, httpStatusCode });
  }
}

/**
 * Authorization error class for permission/access denied scenarios
 */
export class PockityErrorAuthorization extends PockityBaseErrorClass {
  constructor({ message, httpStatusCode }: { message: string; httpStatusCode: number }) {
    super({ message, httpStatusCode });
  }
}

/**
 * Bad request error class for client-side errors (400 status codes)
 */
export class PockityErrorBadRequest extends PockityBaseErrorClass {
  constructor({ message, details, httpStatusCode }: { message: string; details?: any; httpStatusCode: number }) {
    super({ message, details, httpStatusCode });
  }
}

/**
 * Invalid input error class for validation failures
 */
export class PockityErrorInvalidInput extends PockityBaseErrorClass {
  constructor({ message, details, httpStatusCode }: { message: string; details?: any; httpStatusCode: number }) {
    super({ message, details, httpStatusCode });
  }
}

/**
 * Not found error class for missing resources (404 errors)
 */
export class PockityErrorNotFound extends PockityBaseErrorClass {
  constructor({ message, httpStatusCode }: { message: string; httpStatusCode: number }) {
    super({ message, httpStatusCode });
  }
}

/**
 * Internal server error class for unexpected server-side errors
 */
export class PockityErrorInternalServer extends PockityBaseErrorClass {
  constructor({ message, httpStatusCode }: { message: string; httpStatusCode: number }) {
    super({ message, httpStatusCode });
  }
}

/**
 * Database error class for database operation failures
 */
export class PockityErrorDatabase extends PockityBaseErrorClass {
  constructor({ message, details, httpStatusCode }: { message: string; details?: any; httpStatusCode: number }) {
    super({ message, details, httpStatusCode });
  }
}

/**
 * Unauthorized error class for authentication required scenarios
 */
export class PockityErrorUnauthorized extends PockityBaseErrorClass {
  constructor({ message, httpStatusCode }: { message: string; httpStatusCode: number }) {
    super({ message, httpStatusCode });
  }
}

/**
 * Forbidden error class for access denied scenarios
 */
export class PockityErrorForbidden extends PockityBaseErrorClass {
  constructor({ message, httpStatusCode }: { message: string; httpStatusCode: number }) {
    super({ message, httpStatusCode });
  }
}
