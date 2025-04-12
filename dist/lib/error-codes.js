"use strict";
/**
 * Error codes for Metigan SDK
 * Provides consistent error codes and messages for all errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessages = exports.ErrorCode = void 0;
exports.getErrorDetails = getErrorDetails;
var ErrorCode;
(function (ErrorCode) {
    // Authentication errors (1000-1099)
    ErrorCode[ErrorCode["INVALID_API_KEY"] = 1000] = "INVALID_API_KEY";
    ErrorCode[ErrorCode["API_KEY_EXPIRED"] = 1001] = "API_KEY_EXPIRED";
    ErrorCode[ErrorCode["UNAUTHORIZED"] = 1002] = "UNAUTHORIZED";
    // Validation errors (1100-1199)
    ErrorCode[ErrorCode["INVALID_EMAIL_FORMAT"] = 1100] = "INVALID_EMAIL_FORMAT";
    ErrorCode[ErrorCode["INVALID_RECIPIENT"] = 1101] = "INVALID_RECIPIENT";
    ErrorCode[ErrorCode["MISSING_REQUIRED_FIELD"] = 1102] = "MISSING_REQUIRED_FIELD";
    ErrorCode[ErrorCode["INVALID_ATTACHMENT"] = 1103] = "INVALID_ATTACHMENT";
    ErrorCode[ErrorCode["ATTACHMENT_TOO_LARGE"] = 1104] = "ATTACHMENT_TOO_LARGE";
    ErrorCode[ErrorCode["INVALID_TEMPLATE"] = 1105] = "INVALID_TEMPLATE";
    ErrorCode[ErrorCode["INVALID_AUDIENCE_ID"] = 1106] = "INVALID_AUDIENCE_ID";
    // API errors (1200-1299)
    ErrorCode[ErrorCode["API_REQUEST_FAILED"] = 1200] = "API_REQUEST_FAILED";
    ErrorCode[ErrorCode["RATE_LIMIT_EXCEEDED"] = 1201] = "RATE_LIMIT_EXCEEDED";
    ErrorCode[ErrorCode["SERVICE_UNAVAILABLE"] = 1202] = "SERVICE_UNAVAILABLE";
    ErrorCode[ErrorCode["NETWORK_ERROR"] = 1203] = "NETWORK_ERROR";
    ErrorCode[ErrorCode["TIMEOUT"] = 1204] = "TIMEOUT";
    // Contact errors (1300-1399)
    ErrorCode[ErrorCode["CONTACT_NOT_FOUND"] = 1300] = "CONTACT_NOT_FOUND";
    ErrorCode[ErrorCode["CONTACT_ALREADY_EXISTS"] = 1301] = "CONTACT_ALREADY_EXISTS";
    ErrorCode[ErrorCode["CONTACT_UPDATE_FAILED"] = 1302] = "CONTACT_UPDATE_FAILED";
    ErrorCode[ErrorCode["CONTACT_DELETE_FAILED"] = 1303] = "CONTACT_DELETE_FAILED";
    // Email errors (1400-1499)
    ErrorCode[ErrorCode["EMAIL_SEND_FAILED"] = 1400] = "EMAIL_SEND_FAILED";
    ErrorCode[ErrorCode["TEMPLATE_NOT_FOUND"] = 1401] = "TEMPLATE_NOT_FOUND";
    ErrorCode[ErrorCode["INVALID_TEMPLATE_VARIABLES"] = 1402] = "INVALID_TEMPLATE_VARIABLES";
    // Unexpected errors (1900-1999)
    ErrorCode[ErrorCode["UNEXPECTED_ERROR"] = 1900] = "UNEXPECTED_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
/**
* Error message mapping
* Maps error codes to human-readable messages
*/
exports.ErrorMessages = {
    // Authentication errors
    [ErrorCode.INVALID_API_KEY]: "Invalid API key provided",
    [ErrorCode.API_KEY_EXPIRED]: "API key has expired",
    [ErrorCode.UNAUTHORIZED]: "Unauthorized access",
    // Validation errors
    [ErrorCode.INVALID_EMAIL_FORMAT]: "Invalid email format",
    [ErrorCode.INVALID_RECIPIENT]: "Invalid recipient email",
    [ErrorCode.MISSING_REQUIRED_FIELD]: "Missing required field",
    [ErrorCode.INVALID_ATTACHMENT]: "Invalid attachment format",
    [ErrorCode.ATTACHMENT_TOO_LARGE]: "Attachment exceeds the maximum size of 7MB",
    [ErrorCode.INVALID_TEMPLATE]: "Invalid template format",
    [ErrorCode.INVALID_AUDIENCE_ID]: "Invalid audience ID",
    // API errors
    [ErrorCode.API_REQUEST_FAILED]: "API request failed",
    [ErrorCode.RATE_LIMIT_EXCEEDED]: "Rate limit exceeded",
    [ErrorCode.SERVICE_UNAVAILABLE]: "Service temporarily unavailable",
    [ErrorCode.NETWORK_ERROR]: "Network connection error",
    [ErrorCode.TIMEOUT]: "Request timed out",
    // Contact errors
    [ErrorCode.CONTACT_NOT_FOUND]: "Contact not found",
    [ErrorCode.CONTACT_ALREADY_EXISTS]: "Contact already exists",
    [ErrorCode.CONTACT_UPDATE_FAILED]: "Failed to update contact",
    [ErrorCode.CONTACT_DELETE_FAILED]: "Failed to delete contact",
    // Email errors
    [ErrorCode.EMAIL_SEND_FAILED]: "Failed to send email",
    [ErrorCode.TEMPLATE_NOT_FOUND]: "Email template not found",
    [ErrorCode.INVALID_TEMPLATE_VARIABLES]: "Invalid template variables",
    // Unexpected errors
    [ErrorCode.UNEXPECTED_ERROR]: "An unexpected error occurred"
};
/**
* Get error details from code
* @param code - Error code
* @param context - Additional context for the error
* @returns Formatted error message with code
*/
function getErrorDetails(code, context) {
    const baseMessage = exports.ErrorMessages[code] || "Unknown error";
    const errorCode = `MET-${code}`;
    if (context) {
        return `${errorCode}: ${baseMessage} - ${context}`;
    }
    return `${errorCode}: ${baseMessage}`;
}
//# sourceMappingURL=error-codes.js.map