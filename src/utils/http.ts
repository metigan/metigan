/**
 * HTTP utility for making API requests
 * Abstracts the actual HTTP client implementation
 */

import axios from 'axios';

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
export async function post<T>(url: string, data: any, headers: Record<string, string>): Promise<T> {
  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error: any) {
    const httpError: HttpError = {
      status: error.response?.status || 0,
      data: error.response?.data || {},
      message: error.message || 'Unknown error'
    };
    throw httpError;
  }
}

export function get<T>(url: string, headers: Record<string, string>): T | PromiseLike<T> {
    throw new Error('Function not implemented.');
}
