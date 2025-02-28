/**
 * Validation utilities for Metigan
 */

/**
 * Validates an email address format
 * @param email - The email to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
  
  /**
   * Extracts email address from a format like "Name <email@example.com>"
   * @param from - The from field which might include a name
   * @returns The extracted email address
   */
  export function extractEmailAddress(from: string): string {
    const matches = from.match(/<(.+)>/);
    return matches ? matches[1].trim() : from.trim();
  }