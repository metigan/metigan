"use strict";
/**
 * HTTP utility for making API requests
 * Abstracts the actual HTTP client implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = get;
exports.post = post;
exports.put = put;
exports.deleteRequest = deleteRequest;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const errors_1 = require("../lib/errors");
const error_codes_1 = require("../lib/error-codes");
/**
 * Process HTTP errors into standardized format
 * @param error - Axios error object
 * @returns Standardized ApiError
 */
function processHttpError(error) {
    if (axios_1.default.isAxiosError(error)) {
        const axiosError = error;
        // Network errors (no response)
        if (!axiosError.response) {
            if (axiosError.code === 'ECONNABORTED') {
                return new errors_1.NetworkError("Request timed out. Please check your network connection.", error_codes_1.ErrorCode.TIMEOUT);
            }
            return new errors_1.NetworkError("Network error. Please check your internet connection.", error_codes_1.ErrorCode.NETWORK_ERROR);
        }
        // Server responded with error status
        const status = axiosError.response.status;
        const responseData = axiosError.response.data;
        const errorMessage = (responseData === null || responseData === void 0 ? void 0 : responseData.message) || (responseData === null || responseData === void 0 ? void 0 : responseData.error) || "An error occurred during the request";
        return errors_1.ApiError.fromStatus(status, errorMessage);
    }
    // Unknown errors
    return new errors_1.ApiError("An unexpected error occurred during the request", error_codes_1.ErrorCode.UNEXPECTED_ERROR);
}
/**
 * Make a GET request to the specified URL
 * @param url - The URL to make the request to
 * @param headers - The headers to include in the request
 * @returns The response data
 * @throws ApiError if the request fails
 */
async function get(url, headers) {
    try {
        const config = { headers };
        const response = await axios_1.default.get(url, config);
        return response.data;
    }
    catch (error) {
        throw processHttpError(error);
    }
}
/**
 * Make a POST request to the specified URL
 * @param url - The URL to make the request to
 * @param data - The data to send in the request body
 * @param headers - The headers to include in the request
 * @returns The response data
 * @throws ApiError if the request fails
 */
async function post(url, data, headers) {
    try {
        const config = { headers };
        const response = await axios_1.default.post(url, data, config);
        return response.data;
    }
    catch (error) {
        throw processHttpError(error);
    }
}
/**
 * Make a PUT request to the specified URL
 * @param url - The URL to make the request to
 * @param data - The data to send in the request body
 * @param headers - The headers to include in the request
 * @returns The response data
 * @throws ApiError if the request fails
 */
async function put(url, data, headers) {
    try {
        const config = { headers };
        const response = await axios_1.default.put(url, data, config);
        return response.data;
    }
    catch (error) {
        throw processHttpError(error);
    }
}
/**
 * Make a DELETE request to the specified URL
 * @param url - The URL to make the request to
 * @param headers - The headers to include in the request
 * @returns The response data
 * @throws ApiError if the request fails
 */
async function deleteRequest(url, headers) {
    try {
        const config = { headers };
        const response = await axios_1.default.delete(url, config);
        return response.data;
    }
    catch (error) {
        throw processHttpError(error);
    }
}
//# sourceMappingURL=http.js.map