"use strict";
/**
 * HTTP utility for making API requests
 * Abstracts the actual HTTP client implementation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.post = post;
exports.get = get;
const axios_1 = __importDefault(require("axios"));
/**
 * Make a POST request to the specified URL
 * @param url - The URL to make the request to
 * @param data - The data to send in the request body
 * @param headers - The headers to include in the request
 * @returns The response data
 * @throws HttpError if the request fails
 */
async function post(url, data, headers) {
    var _a, _b;
    try {
        const response = await axios_1.default.post(url, data, { headers });
        return response.data;
    }
    catch (error) {
        const httpError = {
            status: ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 0,
            data: ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || {},
            message: error.message || 'Unknown error'
        };
        throw httpError;
    }
}
function get(url, headers) {
    throw new Error('Function not implemented.');
}
