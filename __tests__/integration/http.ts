import { ApiError, NetworkError } from '../../src/lib/errors';
import { ErrorCode } from '../../src/lib/error-codes';

export const get = jest.fn();
export const post = jest.fn();
export const put = jest.fn();
export const deleteRequest = jest.fn();

// Helper function to create API errors for testing
export function createApiError(status: number, message: string): any {
  // Create a base ApiError
  const error = ApiError.fromStatus(status, message);
  
  // Return a custom object that extends the ApiError with test-specific properties
  return {
    ...error,
    status,
    data: { error: `${status} Error`, message },
    message,
    // Ensure the error is still an instance of ApiError for instanceof checks
    __proto__: Object.getPrototypeOf(error)
  };
}

// Helper function to create network errors for testing
export function createNetworkError(message: string, code: ErrorCode): NetworkError {
  return new NetworkError(message, code);
}