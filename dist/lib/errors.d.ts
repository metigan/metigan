/**
 * Custom error classes for Metigan
 */
/**
 * Base error class for Metigan-specific errors
 * Hides implementation details from stack traces
 */
export declare class MetiganError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when validation fails
 */
export declare class ValidationError extends MetiganError {
    constructor(message: string);
}
/**
 * Error thrown when API request fails
 */
export declare class ApiError extends MetiganError {
    status?: number;
    constructor(message: string, status?: number);
}
