/**
 * Error codes for Metigan SDK
 * Provides consistent error codes and messages for all errors
 */
export declare enum ErrorCode {
    INVALID_API_KEY = 1000,
    API_KEY_EXPIRED = 1001,
    UNAUTHORIZED = 1002,
    INVALID_EMAIL_FORMAT = 1100,
    INVALID_RECIPIENT = 1101,
    MISSING_REQUIRED_FIELD = 1102,
    INVALID_ATTACHMENT = 1103,
    ATTACHMENT_TOO_LARGE = 1104,
    INVALID_TEMPLATE = 1105,
    INVALID_AUDIENCE_ID = 1106,
    API_REQUEST_FAILED = 1200,
    RATE_LIMIT_EXCEEDED = 1201,
    SERVICE_UNAVAILABLE = 1202,
    NETWORK_ERROR = 1203,
    TIMEOUT = 1204,
    CONTACT_NOT_FOUND = 1300,
    CONTACT_ALREADY_EXISTS = 1301,
    CONTACT_UPDATE_FAILED = 1302,
    CONTACT_DELETE_FAILED = 1303,
    EMAIL_SEND_FAILED = 1400,
    TEMPLATE_NOT_FOUND = 1401,
    INVALID_TEMPLATE_VARIABLES = 1402,
    UNEXPECTED_ERROR = 1900
}
/**
* Error message mapping
* Maps error codes to human-readable messages
*/
export declare const ErrorMessages: Record<ErrorCode, string>;
/**
* Get error details from code
* @param code - Error code
* @param context - Additional context for the error
* @returns Formatted error message with code
*/
export declare function getErrorDetails(code: ErrorCode, context?: string): string;
//# sourceMappingURL=error-codes.d.ts.map