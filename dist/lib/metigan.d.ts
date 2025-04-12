/**
 * Metigan - Email Sending Library
 * A simple library for sending emails through the Metigan API
 * @version 1.5.1
 */
import type { EmailOptions, EmailApiResponse, TemplateFunction, ContactApiResponse, ContactCreationOptions, ContactQueryOptions, ContactUpdateOptions, TemplateOptions, AudienceCreationOptions, AudienceUpdateOptions, AudienceApiResponse } from "./types";
/**
 * Metigan client options
 */
export interface MetiganOptions {
    /** User ID for logs */
    userId?: string;
    /** Disable logs */
    disableLogs?: boolean;
    /** Number of retry attempts for failed operations */
    retryCount?: number;
    /** Base time between retry attempts (ms) */
    retryDelay?: number;
    /** Timeout for requests (ms) */
    timeout?: number;
    /** Base URL for API (optional, defaults to localhost) */
    baseUrl?: string;
}
/**
 * Metigan client for sending emails
 */
export declare class Metigan {
    private apiKey;
    private logger;
    private timeout;
    private retryCount;
    private retryDelay;
    private baseApiUrl;
    private baseContactApiUrl;
    private baseAudienceApiUrl;
    private baseLogApiUrl;
    /**
     * Create a new Metigan client
     * @param apiKey - Your API key
     * @param options - Client options
     */
    constructor(apiKey: string, options?: MetiganOptions);
    /**
     * Enables logging
     */
    enableLogging(): void;
    /**
     * Disables logging
     */
    disableLogging(): void;
    /**
     * Validates an email address format
     * @param email - The email to validate
     * @returns True if email is valid
     * @private
     */
    private _validateEmail;
    /**
     * Extracts email address from a format like "Name <email@example.com>"
     * @param from - The from field which might include a name
     * @returns The extracted email address
     * @private
     */
    private _extractEmailAddress;
    /**
     * Validates email message data
     * @param messageData - The email message data
     * @returns Validation result with status and error message
     * @private
     */
    private _validateMessageData;
    /**
     * Validates contact creation options
     * @param options - Contact creation options
     * @param emails - List of emails to create contacts for
     * @returns Validation result with status and error message
     * @private
     */
    private _validateContactOptions;
    /**
     * Validates contact query options
     * @param options - Contact query options
     * @returns Validation result with status and error message
     * @private
     */
    private _validateContactQueryOptions;
    /**
     * Validates contact update options
     * @param email - Email address of the contact to update
     * @param options - Contact update options
     * @returns Validation result with status and error message
     * @private
     */
    private _validateContactUpdateOptions;
    /**
     * Validates audience creation options
     * @param options - Audience creation options
     * @returns Validation result with status and error message
     * @private
     */
    private _validateAudienceCreationOptions;
    /**
     * Validates audience update options
     * @param id - Audience ID
     * @param options - Audience update options
     * @returns Validation result with status and error message
     * @private
     */
    private _validateAudienceUpdateOptions;
    /**
     * Detect if we're in a browser environment
     * @returns True if in browser environment
     * @private
     */
    private _isBrowserEnvironment;
    /**
     * Process attachments for the email
     * @param attachments - Array of files or file-like objects
     * @returns Processed attachments
     * @private
     */
    private _processAttachments;
    /**
     * Get MIME type based on file extension
     * @param filename - File name
     * @returns MIME type
     * @private
     */
    private _getMimeType;
    /**
     * Prepares authentication headers for API requests
     * @returns Headers object with authentication
     * @private
     */
    private _prepareAuthHeaders;
    /**
     * Attempts to make an HTTP request with retry system
     * @param url - Request URL
     * @param data - Data to send
     * @param headers - Request headers
     * @param method - HTTP method
     * @private
     */
    private _makeRequestWithRetry;
    /**
     * Creates contacts in the specified audience
     * @param emails - List of email addresses to create contacts for
     * @param options - Contact creation options
     * @returns Response from the API
     */
    createContacts(emails: string[], options: ContactCreationOptions): Promise<ContactApiResponse>;
    /**
     * Get a contact by email
     * @param email - Email address of the contact
     * @param audienceId - Audience ID from Metigan dashboard
     * @returns Response from the API
     */
    getContact(email: string, audienceId: string): Promise<ContactApiResponse>;
    /**
     * List contacts in an audience
     * @param options - Contact query options
     * @returns Response from the API
     */
    listContacts(options: ContactQueryOptions): Promise<ContactApiResponse>;
    /**
     * Update a contact
     * @param email - Email address of the contact to update
     * @param options - Contact update options
     * @returns Response from the API
     */
    updateContact(email: string, options: ContactUpdateOptions): Promise<ContactApiResponse>;
    /**
   * Delete a contact
   * @param contactId - ID of the contact to delete
   * @param audienceId - Audience ID from Metigan dashboard
   * @returns Response from the API
   */
    deleteContact(contactId: string, audienceId: string): Promise<ContactApiResponse>;
    /**
     * Create a new audience
     * @param options - Audience creation options
     * @returns Response from the API
     */
    createAudience(options: AudienceCreationOptions): Promise<AudienceApiResponse>;
    /**
     * Get all audiences
     * @returns Response from the API
     */
    getAudiences(): Promise<AudienceApiResponse>;
    /**
     * Get an audience by ID
     * @param id - Audience ID
     * @returns Response from the API
     */
    getAudience(id: string): Promise<AudienceApiResponse>;
    /**
     * Update an audience
     * @param id - Audience ID
     * @param options - Audience update options
     * @returns Response from the API
     */
    updateAudience(id: string, options: AudienceUpdateOptions): Promise<AudienceApiResponse>;
    /**
     * Delete an audience
     * @param id - Audience ID
     * @returns Response from the API
     */
    deleteAudience(id: string): Promise<AudienceApiResponse>;
    /**
     * Send an email
     * @param options - Email options
     * @returns Response from the API
     */
    sendEmail(options: EmailOptions): Promise<EmailApiResponse>;
    /**
     * Send an email and create contacts in one operation
     * @param options - Email options with contact creation settings
     * @returns Response from the API
     */
    sendEmailAndCreateContacts(options: EmailOptions): Promise<EmailApiResponse>;
    /**
     * Send an email using a template
     * @param options - Template options including templateId
     * @returns Response from the API
     */
    sendEmailWithTemplate(options: TemplateOptions): Promise<EmailApiResponse>;
    /**
     * Send an email with template and create contacts in one operation
     * @param options - Template options with contact creation settings
     * @returns Response from the API
     */
    sendTemplateAndCreateContacts(options: TemplateOptions): Promise<EmailApiResponse>;
    /**
     * Create an email template with placeholders
     * @param htmlContent - HTML content with {{placeholders}}
     * @returns Template function that accepts variables
     */
    createTemplate(htmlContent: string): TemplateFunction;
    /**
     * Generates a unique tracking ID for email analytics
     * @returns A unique tracking ID string
     */
    generateTrackingId(): string;
}
export default Metigan;
//# sourceMappingURL=metigan.d.ts.map