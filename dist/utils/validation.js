"use strict";
/**
 * Validation utilities for Metigan
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.extractEmailAddress = extractEmailAddress;
/**
 * Validates an email address format
 * @param email - The email to validate
 * @returns True if email is valid
 */
function isValidEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
/**
 * Extracts email address from a format like "Name <email@example.com>"
 * @param from - The from field which might include a name
 * @returns The extracted email address
 */
function extractEmailAddress(from) {
    const matches = from.match(/<(.+)>/);
    return matches ? matches[1].trim() : from.trim();
}
//# sourceMappingURL=validation.js.map