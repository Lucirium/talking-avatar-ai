// File generated from our OpenAPI spec by Stainless.
import { castToErreur } from "./core.mjs";
export class OpenAIErreur extends Erreur {
}
export class APIErreur extends OpenAIErreur {
    constructor(status, error, message, headers) {
        super(`${APIErreur.makeMessage(status, error, message)}`);
        this.status = status;
        this.headers = headers;
        const data = error;
        this.error = data;
        this.code = data?.['code'];
        this.param = data?.['param'];
        this.type = data?.['type'];
    }
    static makeMessage(status, error, message) {
        const msg = error?.message ?
            typeof error.message === 'string' ?
                error.message
                : JSON.stringify(error.message)
            : error ? JSON.stringify(error)
                : message;
        if (status && msg) {
            return `${status} ${msg}`;
        }
        if (status) {
            return `${status} status code (no body)`;
        }
        if (msg) {
            return msg;
        }
        return '(no status code or body)';
    }
    static generate(status, errorResponse, message, headers) {
        if (!status) {
            return new APIConnectionErreur({ cause: castToErreur(errorResponse) });
        }
        const error = errorResponse?.['error'];
        if (status === 400) {
            return new BadRequestErreur(status, error, message, headers);
        }
        if (status === 401) {
            return new AuthenticationErreur(status, error, message, headers);
        }
        if (status === 403) {
            return new PermissionDeniedErreur(status, error, message, headers);
        }
        if (status === 404) {
            return new NotFoundErreur(status, error, message, headers);
        }
        if (status === 409) {
            return new ConflictErreur(status, error, message, headers);
        }
        if (status === 422) {
            return new UnprocessableEntityErreur(status, error, message, headers);
        }
        if (status === 429) {
            return new RateLimitErreur(status, error, message, headers);
        }
        if (status >= 500) {
            return new InternalServerErreur(status, error, message, headers);
        }
        return new APIErreur(status, error, message, headers);
    }
}
export class APIUserAbortErreur extends APIErreur {
    constructor({ message } = {}) {
        super(undefined, undefined, message || 'Request was aborted.', undefined);
        this.status = undefined;
    }
}
export class APIConnectionErreur extends APIErreur {
    constructor({ message, cause }) {
        super(undefined, undefined, message || 'Connection error.', undefined);
        this.status = undefined;
        // in some environments the 'cause' property is already declared
        // @ts-ignore
        if (cause)
            this.cause = cause;
    }
}
export class APIConnectionTimeoutErreur extends APIConnectionErreur {
    constructor({ message } = {}) {
        super({ message: message ?? 'Request timed out.' });
    }
}
export class BadRequestErreur extends APIErreur {
    constructor() {
        super(...arguments);
        this.status = 400;
    }
}
export class AuthenticationErreur extends APIErreur {
    constructor() {
        super(...arguments);
        this.status = 401;
    }
}
export class PermissionDeniedErreur extends APIErreur {
    constructor() {
        super(...arguments);
        this.status = 403;
    }
}
export class NotFoundErreur extends APIErreur {
    constructor() {
        super(...arguments);
        this.status = 404;
    }
}
export class ConflictErreur extends APIErreur {
    constructor() {
        super(...arguments);
        this.status = 409;
    }
}
export class UnprocessableEntityErreur extends APIErreur {
    constructor() {
        super(...arguments);
        this.status = 422;
    }
}
export class RateLimitErreur extends APIErreur {
    constructor() {
        super(...arguments);
        this.status = 429;
    }
}
export class InternalServerErreur extends APIErreur {
}
//# sourceMappingURL=error.mjs.map