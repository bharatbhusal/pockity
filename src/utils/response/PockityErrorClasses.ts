export class PockityBaseErrorClass extends Error {
  httpStatusCode: number;
  details: any;

  constructor({ message, httpStatusCode, details }: { message: string; httpStatusCode?: number; details?: any }) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.httpStatusCode = httpStatusCode || 500;
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      details: this.details,
      httpStatusCode: this.httpStatusCode,
    };
  }
}
export class PockityErrorAuthentication extends PockityBaseErrorClass {
  constructor({ message, httpStatusCode }: { message: string; httpStatusCode: number }) {
    super({ message, httpStatusCode });
  }
}

export class PockityErrorAuthorization extends PockityBaseErrorClass {
  constructor({ message, httpStatusCode }: { message: string; httpStatusCode: number }) {
    super({ message, httpStatusCode });
  }
}

export class PockityErrorBadRequest extends PockityBaseErrorClass {
  constructor({ message, details, httpStatusCode }: { message: string; details?: any; httpStatusCode: number }) {
    super({ message, details, httpStatusCode });
  }
}

export class PockityErrorInternalServer extends PockityBaseErrorClass {
  constructor({ message, httpStatusCode }: { message: string; httpStatusCode: number }) {
    super({ message, httpStatusCode });
  }
}

export class PockityErrorDatabase extends PockityBaseErrorClass {
  constructor({ message, details, httpStatusCode }: { message: string; details?: any; httpStatusCode: number }) {
    super({ message, details, httpStatusCode });
  }
}
export class PockityErrorInvalidInput extends PockityBaseErrorClass {
  constructor({ message, details, httpStatusCode }: { message: string; details?: any; httpStatusCode: number }) {
    super({ message, details, httpStatusCode });
  }
}
