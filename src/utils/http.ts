/**
 * HTTP utility for making API requests
 * Abstracts the actual HTTP client implementation
 */

import axios, { type AxiosRequestConfig, AxiosError } from "axios";
import { ApiError, NetworkError } from "../lib/errors";
import { ErrorCode } from "../lib/error-codes";

/**
 * HTTP error interface
 */
export interface HttpError {
    status: number;
    data: any;
    message: string;
}

/**
 * Process HTTP errors into standardized format
 * @param error - Axios error object
 * @returns Standardized ApiError
 */
function processHttpError(error: unknown): ApiError | NetworkError {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Network errors (no response)
        if (!axiosError.response) {
            if (axiosError.code === 'ECONNABORTED') {
                return new NetworkError(
                    "Request timed out. Please check your network connection.",
                    ErrorCode.TIMEOUT
                );
            }
            return new NetworkError(
                "Network error. Please check your internet connection.",
                ErrorCode.NETWORK_ERROR
            );
        }
        
        // Server responded with error status
        const status = axiosError.response.status;
        const responseData = axiosError.response.data as any;
        const errorMessage = responseData?.message || responseData?.error || "An error occurred during the request";
        
        return ApiError.fromStatus(status, errorMessage);
    }
    
    // Unknown errors
    return new ApiError(
        "An unexpected error occurred during the request",
        ErrorCode.UNEXPECTED_ERROR
    );
}

/**
 * Make a GET request to the specified URL
 * @param url - The URL to make the request to
 * @param headers - The headers to include in the request
 * @returns The response data
 * @throws ApiError if the request fails
 */
export async function get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    try {
        const config: AxiosRequestConfig = { headers };
        const response = await axios.get(url, config);
        return response.data;
    } catch (error: unknown) {
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
export async function post<T>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    try {
        const config: AxiosRequestConfig = { headers };
        const response = await axios.post(url, data, config);
        return response.data;
    } catch (error: unknown) {
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
export async function put<T>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    try {
        const config: AxiosRequestConfig = { headers };
        const response = await axios.put(url, data, config);
        return response.data;
    } catch (error: unknown) {
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
export async function deleteRequest<T>(url: string, headers?: Record<string, string>): Promise<T> {
    try {
        const config: AxiosRequestConfig = { headers };
        const response = await axios.delete(url, config);
        return response.data;
    } catch (error: unknown) {
        throw processHttpError(error);
    }
}