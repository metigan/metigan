/**
 * Custom error classes for Metigan
 */

/**
 * Base error class for Metigan-specific errors
 * Hides implementation details from stack traces
 */
export class MetiganError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'MetiganError';
      
      // This prevents the implementation details from showing in the stack trace
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  /**
   * Error thrown when validation fails
   */
  export class ValidationError extends MetiganError {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  }
  
  /**
   * Error thrown when API request fails
   */
  export class ApiError extends MetiganError {
    status?: number;
    
    constructor(message: string, status?: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }