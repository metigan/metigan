/**
 * HTTP utility for making API requests
 * Abstracts the actual HTTP client implementation
 */
/**
 * HTTP error interface
 */
export interface HttpError {
    status: number;
    data: any;
    message: string;
}
/**
 * Make a GET request to the specified URL
 * @param url - The URL to make the request to
 * @param headers - The headers to include in the request
 * @returns The response data
 * @throws ApiError if the request fails
 */
export declare function get<T>(url: string, headers?: Record<string, string>): Promise<T>;
/**
 * Make a POST request to the specified URL
 * @param url - The URL to make the request to
 * @param data - The data to send in the request body
 * @param headers - The headers to include in the request
 * @returns The response data
 * @throws ApiError if the request fails
 */
export declare function post<T>(url: string, data: any, headers?: Record<string, string>): Promise<T>;
/**
 * Make a PUT request to the specified URL
 * @param url - The URL to make the request to
 * @param data - The data to send in the request body
 * @param headers - The headers to include in the request
 * @returns The response data
 * @throws ApiError if the request fails
 */
export declare function put<T>(url: string, data: any, headers?: Record<string, string>): Promise<T>;
/**
 * Make a DELETE request to the specified URL
 * @param url - The URL to make the request to
 * @param headers - The headers to include in the request
 * @returns The response data
 * @throws ApiError if the request fails
 */
export declare function deleteRequest<T>(url: string, headers?: Record<string, string>): Promise<T>;
//# sourceMappingURL=http.d.ts.map