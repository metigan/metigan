/**
 * Type declarations for Metigan Email Library
 */

declare module 'metigan' {
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
      /** Optional tracking ID for email analytics */
      trackingId?: string;
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
        trackingId: string;
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
     * Metigan client for sending emails
     */
    export class Metigan {
      /**
       * Create a new Metigan client
       * @param apiKey - Your API key
       */
      constructor(apiKey: string);
  
      /**
       * Send an email
       * @param options - Email options
       * @returns Response from the API
       */
      sendEmail(options: EmailOptions): Promise<EmailApiResponse>;
  
      /**
       * Create an email template with placeholders
       * @param htmlContent - HTML content with {{placeholders}}
       * @returns Template function that accepts variables
       */
      createTemplate(htmlContent: string): TemplateFunction;
    }
  
    // Default export
    const MetiganDefault: typeof Metigan;
    export default MetiganDefault;
  }