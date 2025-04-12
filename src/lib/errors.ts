/**
 * Custom error classes for Metigan
 */

import { ErrorCode, getErrorDetails } from "./error-codes";

/**
 * Base error class for Metigan-specific errors
 * Hides implementation details from stack traces
 */
export class MetiganError extends Error {
  code: ErrorCode;
  
  constructor(message: string, code: ErrorCode = ErrorCode.UNEXPECTED_ERROR) {
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
  getFormattedMessage(): string {
    return `MET-${this.code}: ${this.message}`;
  }

  /**
   * Create an error from an error code
   * @param code - Error code
   * @param context - Additional context for the error
   * @returns MetiganError instance
   */
  static fromCode(code: ErrorCode, context?: string): MetiganError {
    return new MetiganError(getErrorDetails(code, context), code);
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends MetiganError {
  constructor(message: string, code: ErrorCode = ErrorCode.MISSING_REQUIRED_FIELD) {
    super(message, code);
    this.name = "ValidationError";
  }

  /**
   * Create a validation error from an error code
   * @param code - Error code
   * @param context - Additional context for the error
   * @returns ValidationError instance
   */
  static fromCode(code: ErrorCode, context?: string): ValidationError {
    return new ValidationError(getErrorDetails(code, context), code);
  }
}

/**
 * Error thrown when API request fails
 */
export class ApiError extends MetiganError {
  status?: number;

  constructor(message: string, code: ErrorCode = ErrorCode.API_REQUEST_FAILED, status?: number) {
    super(message, code);
    this.name = "ApiError";
    this.status = status;
    
    // This prevents the implementation details from showing in the stack trace
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
  static fromCode(code: ErrorCode, context?: string): ApiError {
    // Extract status from context if it's in the format "STATUS:message"
    let status: number | undefined;
    let contextMessage = context;
    
    if (context && context.includes(':')) {
      const parts = context.split(':', 2);
      const potentialStatus = parseInt(parts[0], 10);
      if (!isNaN(potentialStatus)) {
        status = potentialStatus;
        contextMessage = parts[1];
      }
    }
    
    return new ApiError(getErrorDetails(code, contextMessage), code, status);
  }

  /**
   * Create an API error from HTTP status
   * @param status - HTTP status code
   * @param context - Additional context for the error
   * @returns ApiError instance
   */
  static fromStatus(status: number, context?: string): ApiError {
    let code: ErrorCode;
    
    switch (status) {
      case 400:
        code = ErrorCode.MISSING_REQUIRED_FIELD;
        break;
      case 401:
      case 403:
        code = ErrorCode.UNAUTHORIZED;
        break;
      case 404:
        code = ErrorCode.API_REQUEST_FAILED;
        break;
      case 422:
        code = ErrorCode.INVALID_EMAIL_FORMAT;
        break;
      case 429:
        code = ErrorCode.RATE_LIMIT_EXCEEDED;
        break;
      case 500:
      case 502:
      case 503:
        code = ErrorCode.SERVICE_UNAVAILABLE;
        break;
      default:
        code = ErrorCode.API_REQUEST_FAILED;
    }
    
    return new ApiError(getErrorDetails(code, context), code, status);
  }
}

/**
 * Error thrown when network issues occur
 */
export class NetworkError extends MetiganError {
  constructor(message: string, code: ErrorCode = ErrorCode.NETWORK_ERROR) {
    super(message, code);
    this.name = "NetworkError";
    
    // This prevents the implementation details from showing in the stack trace
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
  static fromCode(code: ErrorCode, context?: string): NetworkError {
    return new NetworkError(getErrorDetails(code, context), code);
  }
}

/**
 * Error thrown when contact operations fail
 */
export class ContactError extends MetiganError {
  constructor(message: string, code: ErrorCode = ErrorCode.CONTACT_NOT_FOUND) {
    super(message, code);
    this.name = "ContactError";
    
    // This prevents the implementation details from showing in the stack trace
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
  static fromCode(code: ErrorCode, context?: string): ContactError {
    return new ContactError(getErrorDetails(code, context), code);
  }
}