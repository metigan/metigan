/**
 * Validation utilities for Metigan
 */
/**
 * Validates an email address format
 * @param email - The email to validate
 * @returns True if email is valid
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Extracts email address from a format like "Name <email@example.com>"
 * @param from - The from field which might include a name
 * @returns The extracted email address
 */
export declare function extractEmailAddress(from: string): string;
