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
 * Make a POST request to the specified URL
 * @param url - The URL to make the request to
 * @param data - The data to send in the request body
 * @param headers - The headers to include in the request
 * @returns The response data
 * @throws HttpError if the request fails
 */
export declare function post<T>(url: string, data: any, headers: Record<string, string>): Promise<T>;
export declare function get<T>(url: string, headers: Record<string, string>): T | PromiseLike<T>;
