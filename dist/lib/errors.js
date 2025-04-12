"use strict";
/**
 * Custom error classes for Metigan
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactError = exports.NetworkError = exports.ApiError = exports.ValidationError = exports.MetiganError = void 0;
const error_codes_1 = require("./error-codes");
/**
 * Base error class for Metigan-specific errors
 * Hides implementation details from stack traces
 */
class MetiganError extends Error {
    constructor(message, code = error_codes_1.ErrorCode.UNEXPECTED_ERROR) {
        super(message);
        this.name = "MetiganError";
        this.code = code;
        // This prevents the implementation details from showing in the stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Get a formatted error message with code
     */
    getFormattedMessage() {
        return `MET-${this.code}: ${this.message}`;
    }
    /**
     * Create an error from an error code
     * @param code - Error code
     * @param context - Additional context for the error
     * @returns MetiganError instance
     */
    static fromCode(code, context) {
        return new MetiganError((0, error_codes_1.getErrorDetails)(code, context), code);
    }
}
exports.MetiganError = MetiganError;
/**
 * Error thrown when validation fails
 */
class ValidationError extends MetiganError {
    constructor(message, code = error_codes_1.ErrorCode.MISSING_REQUIRED_FIELD) {
        super(message, code);
        this.name = "ValidationError";
        // Ensure stack trace is properly captured
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Create a validation error from an error code
     * @param code - Error code
     * @param context - Additional context for the error
     * @returns ValidationError instance
     */
    static fromCode(code, context) {
        return new ValidationError((0, error_codes_1.getErrorDetails)(code, context), code);
    }
}
exports.ValidationError = ValidationError;
/**
 * Error thrown when API request fails
 */
class ApiError extends MetiganError {
    constructor(message, code = error_codes_1.ErrorCode.API_REQUEST_FAILED, status) {
        super(message, code);
        this.name = "ApiError";
        this.status = status;
        // Ensure stack trace is properly captured
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Create an API error from an error code
     * @param code - Error code
     * @param context - Additional context for the error
     * @returns ApiError instance
     */
    static fromCode(code, context) {
        // Extract status from context if it's in the format "STATUS:message"
        let status;
        let contextMessage = context;
        if (context && context.includes(':')) {
            const parts = context.split(':', 2);
            const potentialStatus = parseInt(parts[0], 10);
            if (!isNaN(potentialStatus)) {
                status = potentialStatus;
                contextMessage = parts[1];
            }
        }
        return new ApiError((0, error_codes_1.getErrorDetails)(code, contextMessage), code, status);
    }
    /**
     * Create an API error from HTTP status
     * @param status - HTTP status code
     * @param context - Additional context for the error
     * @returns ApiError instance
     */
    static fromStatus(status, context) {
        let code;
        switch (status) {
            case 400:
                code = error_codes_1.ErrorCode.MISSING_REQUIRED_FIELD;
                break;
            case 401:
            case 403:
                code = error_codes_1.ErrorCode.UNAUTHORIZED;
                break;
            case 404:
                code = error_codes_1.ErrorCode.API_REQUEST_FAILED;
                break;
            case 422:
                code = error_codes_1.ErrorCode.INVALID_EMAIL_FORMAT;
                break;
            case 429:
                code = error_codes_1.ErrorCode.RATE_LIMIT_EXCEEDED;
                break;
            case 500:
            case 502:
            case 503:
                code = error_codes_1.ErrorCode.SERVICE_UNAVAILABLE;
                break;
            default:
                code = error_codes_1.ErrorCode.API_REQUEST_FAILED;
        }
        return new ApiError((0, error_codes_1.getErrorDetails)(code, context), code, status);
    }
}
exports.ApiError = ApiError;
/**
 * Error thrown when network issues occur
 */
class NetworkError extends MetiganError {
    constructor(message, code = error_codes_1.ErrorCode.NETWORK_ERROR) {
        super(message, code);
        this.name = "NetworkError";
        // Ensure stack trace is properly captured
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Create a network error from an error code
     * @param code - Error code
     * @param context - Additional context for the error
     * @returns NetworkError instance
     */
    static fromCode(code, context) {
        return new NetworkError((0, error_codes_1.getErrorDetails)(code, context), code);
    }
}
exports.NetworkError = NetworkError;
/**
 * Error thrown when contact operations fail
 */
class ContactError extends MetiganError {
    constructor(message, code = error_codes_1.ErrorCode.CONTACT_NOT_FOUND) {
        super(message, code);
        this.name = "ContactError";
        // Ensure stack trace is properly captured
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Create a contact error from an error code
     * @param code - Error code
     * @param context - Additional context for the error
     * @returns ContactError instance
     */
    static fromCode(code, context) {
        return new ContactError((0, error_codes_1.getErrorDetails)(code, context), code);
    }
}
exports.ContactError = ContactError;
//# sourceMappingURL=errors.js.map