"use strict";
/**
 * Custom error classes for Metigan
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.ValidationError = exports.MetiganError = void 0;
/**
 * Base error class for Metigan-specific errors
 * Hides implementation details from stack traces
 */
class MetiganError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MetiganError';
        // This prevents the implementation details from showing in the stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.MetiganError = MetiganError;
/**
 * Error thrown when validation fails
 */
class ValidationError extends MetiganError {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Error thrown when API request fails
 */
class ApiError extends MetiganError {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}
exports.ApiError = ApiError;
