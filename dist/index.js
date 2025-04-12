"use strict";
/**
 * Metigan - Email Sending Library
 * Main entry point
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorDetails = exports.ErrorMessages = exports.ErrorCode = exports.ContactError = exports.NetworkError = exports.ApiError = exports.ValidationError = exports.MetiganError = exports.Metigan = exports.default = void 0;
const tslib_1 = require("tslib");
// Re-export main class and types
var metigan_1 = require("./lib/metigan");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return tslib_1.__importDefault(metigan_1).default; } });
var metigan_2 = require("./lib/metigan");
Object.defineProperty(exports, "Metigan", { enumerable: true, get: function () { return metigan_2.Metigan; } });
var errors_1 = require("./lib/errors");
Object.defineProperty(exports, "MetiganError", { enumerable: true, get: function () { return errors_1.MetiganError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_1.ValidationError; } });
Object.defineProperty(exports, "ApiError", { enumerable: true, get: function () { return errors_1.ApiError; } });
Object.defineProperty(exports, "NetworkError", { enumerable: true, get: function () { return errors_1.NetworkError; } });
Object.defineProperty(exports, "ContactError", { enumerable: true, get: function () { return errors_1.ContactError; } });
var error_codes_1 = require("./lib/error-codes");
Object.defineProperty(exports, "ErrorCode", { enumerable: true, get: function () { return error_codes_1.ErrorCode; } });
Object.defineProperty(exports, "ErrorMessages", { enumerable: true, get: function () { return error_codes_1.ErrorMessages; } });
Object.defineProperty(exports, "getErrorDetails", { enumerable: true, get: function () { return error_codes_1.getErrorDetails; } });
//# sourceMappingURL=index.js.map