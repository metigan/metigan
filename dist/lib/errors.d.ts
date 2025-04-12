/**
 * Custom error classes for Metigan
 */
import { ErrorCode } from "./error-codes";
/**
 * Base error class for Metigan-specific errors
 * Hides implementation details from stack traces
 */
export declare class MetiganError extends Error {
    code: ErrorCode;
    constructor(message: string, code?: ErrorCode);
    /**
     * Get a formatted error message with code
     */
    getFormattedMessage(): string;
    /**
     * Create an error from an error code
     * @param code - Error code
     * @param context - Additional context for the error
     * @returns MetiganError instance
     */
    static fromCode(code: ErrorCode, context?: string): MetiganError;
}
/**
 * Error thrown when validation fails
 */
export declare class ValidationError extends MetiganError {
    constructor(message: string, code?: ErrorCode);
    /**
     * Create a validation error from an error code
     * @param code - Error code
     * @param context - Additional context for the error
     * @returns ValidationError instance
     */
    static fromCode(code: ErrorCode, context?: string): ValidationError;
}
/**
 * Error thrown when API request fails
 */
export declare class ApiError extends MetiganError {
    status?: number;
    constructor(message: string, code?: ErrorCode, status?: number);
    /**
     * Create an API error from an error code
     * @param code - Error code
     * @param context - Additional context for the error
     * @returns ApiError instance
     */
    static fromCode(code: ErrorCode, context?: string): ApiError;
    /**
     * Create an API error from HTTP status
     * @param status - HTTP status code
     * @param context - Additional context for the error
     * @returns ApiError instance
     */
    static fromStatus(status: number, context?: string): ApiError;
}
/**
 * Error thrown when network issues occur
 */
export declare class NetworkError extends MetiganError {
    constructor(message: string, code?: ErrorCode);
    /**
     * Create a network error from an error code
     * @param code - Error code
     * @param context - Additional context for the error
     * @returns NetworkError instance
     */
    static fromCode(code: ErrorCode, context?: string): NetworkError;
}
/**
 * Error thrown when contact operations fail
 */
export declare class ContactError extends MetiganError {
    constructor(message: string, code?: ErrorCode);
    /**
     * Create a contact error from an error code
     * @param code - Error code
     * @param context - Additional context for the error
     * @returns ContactError instance
     */
    static fromCode(code: ErrorCode, context?: string): ContactError;
}
//# sourceMappingURL=errors.d.ts.map