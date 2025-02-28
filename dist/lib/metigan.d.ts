/**
 * Metigan - Email Sending Library
 * A simple library for sending emails through the Metigan API
 * @version 1.1.0
 */
/**
 * Custom error class for Metigan-specific errors
 */
export declare class MetiganError extends Error {
    constructor(message: string);
}
/**
 * Interface for email attachment in Node.js environment
 */
export interface NodeAttachment {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
}
/**
 * Interface for email attachment in any environment
 */
export interface CustomAttachment {
    content: Buffer | ArrayBuffer | Uint8Array | string;
    filename: string;
    contentType: string;
}
/**
 * Email options interface
 */
export interface EmailOptions {
    /** Sender email address (or Name <email>) */
    from: string;
    /** List of recipient email addresses */
    recipients: string[];
    /** Email subject */
    subject: string;
    /** Email content (HTML supported) */
    content: string;
    /** Optional file attachments */
    attachments?: Array<File | NodeAttachment | CustomAttachment>;
    /** Optional CC recipients */
    cc?: string[];
    /** Optional BCC recipients */
    bcc?: string[];
    /** Optional reply-to address */
    replyTo?: string;
}
/**
 * API response interface for successful email
 */
export interface EmailSuccessResponse {
    success: true;
    message: string;
    successfulEmails: {
        success: true;
        recipient: string;
        messageId: string;
    }[];
    failedEmails: {
        success: false;
        recipient: string;
        error: string;
    }[];
    recipientCount: number;
    hasAttachments: boolean;
    attachmentsCount: number;
}
/**
 * API error response interfaces
 */
export interface EmailErrorResponse {
    error: string;
    message: string;
}
/**
 * API key error response
 */
export interface ApiKeyErrorResponse {
    error: string;
}
/**
 * Union type for all possible API responses
 */
export type EmailApiResponse = EmailSuccessResponse | EmailErrorResponse | ApiKeyErrorResponse;
/**
 * Template variables type
 */
export type TemplateVariables = Record<string, string | number | boolean>;
/**
 * Template function type
 */
export type TemplateFunction = (variables?: TemplateVariables) => string;
/**
 * Metigan client options
 */
export interface MetiganOptions {
    /** ID do usuário para logs */
    userId?: string;
    /** Desabilitar logs */
    disableLogs?: boolean;
    /** Número de tentativas para operações que falham */
    retryCount?: number;
    /** Tempo base entre tentativas (ms) */
    retryDelay?: number;
    /** Timeout para requisições (ms) */
    timeout?: number;
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
     * Process attachments for the email
     * @param attachments - Array of files or file-like objects
     * @returns Processed attachments
     * @private
     */
    private _processAttachments;
    /**
     * Get MIME type based on file extension
     * @param filename - Nome do arquivo
     * @returns MIME type
     * @private
     */
    private _getMimeType;
    /**
     * Tenta fazer uma requisição HTTP com sistema de retry
     * @param url - URL da requisição
     * @param data - Dados para enviar
     * @param headers - Cabeçalhos da requisição
     * @param method - Método HTTP
     * @private
     */
    private _makeRequestWithRetry;
    /**
     * Send an email
     * @param options - Email options
     * @returns Response from the API
     */
    sendEmail(options: EmailOptions): Promise<EmailApiResponse>; /**
     * Generates a unique tracking ID for email analytics
     * @returns A unique tracking ID string
     * @private
     */
    private _generateTrackingId;
}
export default Metigan;
